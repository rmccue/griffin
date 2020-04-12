// Override types.
/// <reference path="../../typings/imapflow/index.d.ts" />

import { EventEmitter } from 'events';
import {
	FetchQueryObject,
	ImapFlow,
	ImapFlowOptions,
	MailboxLockObject
} from 'imapflow';

import log from './log';
import { decodeMessageBody, findContentParts } from './mail/content';
import { messageFromImap, parseFlags } from './mail/message';
import { summarizeBodyPart } from './mail/summary';
import { ConnectionOptions, Message, MessageDetails, MessageFlags, PartialMessage, Thread } from '../common/types';

export interface FlagUpdateEvent {
	mailbox: string;
	uid: number;
	flags: MessageFlags;
}

export interface NewMessagesEvent {
	mailbox: string;
	messages: Message[];
}

export declare interface Mailer {
	on( event: 'close', listener: () => void ): this;
	once( event: 'close', listener: () => void ): this;
	emit( event: 'close' ): boolean;
	on( event: 'flags', listener: ( event: FlagUpdateEvent ) => void ): this;
	once( event: 'flags', listener: ( event: FlagUpdateEvent ) => void ): this;
	emit( event: 'flags', data: FlagUpdateEvent ): boolean;
	on( event: 'newMessages', listener: ( event: NewMessagesEvent ) => void ): this;
	once( event: 'newMessages', listener: ( event: NewMessagesEvent ) => void ): this;
	emit( event: 'newMessages', data: NewMessagesEvent ): boolean;
}

export class Mailer extends EventEmitter {
	connected: boolean = false;
	imap: ImapFlow;
	lock: MailboxLockObject | null = null;

	constructor( opts: ConnectionOptions ) {
		super();

		let serviceArgs: ImapFlowOptions;

		switch ( opts.service ) {
			case 'imap':
				serviceArgs = {
					host: opts.host,
					port: opts.port,
					secure: opts.secure,
					auth: {
						user: opts.auth.user,
						pass: opts.auth.pass,
					},
				};
				break;

			case 'gmail':
				serviceArgs = {
					host: 'imap.gmail.com',
					port: 993,
					secure: true,
					auth: {
						user: opts.auth.user,
						pass: opts.auth.pass,
					},
				}
		}

		this.imap = new ImapFlow( {
			...serviceArgs,
			logger: log,
		} );
		this.attachEvents();
	}

	async connect() {
		// Wait until client connects and authorizes
		await this.imap.connect();
		this.connected = true;
	}

	async disconnect() {
		if ( ! this.connected ) {
			// Clean up any sockets.
			this.imap.close();
			return;
		}

		// log out and close connection
		await this.imap.logout();
		this.connected = false;
	}

	attachEvents() {
		this.imap.on( 'close', () => {
			this.emit( 'close' );
		} );
		this.imap.on( 'close', () => {
			console.log( 'close' );
		} );
		this.imap.on( 'exists', async ( data ) => {
			const messages = await this.fetchNewMessages( data.path, data.prevCount, data.count );
			const event: NewMessagesEvent = {
				mailbox: data.path,
				messages,
			};
			this.emit( 'newMessages', event );
		} );
		this.imap.on( 'expunge', ( data ) => {
			console.log( 'expunge', data );
		} );
		this.imap.on( 'flags', ( data ) => {
			if ( ! data.uid ) {
				console.warn( 'oh no', data );
				return;
			}

			const event: FlagUpdateEvent = {
				mailbox: data.path,
				uid: data.uid,
				flags: parseFlags( data.flags ),
			};
			this.emit( 'flags', event );
		} );
	}

	_withLock = ( write: boolean ) => async <T>( mailbox: string, callback: () => Promise<T> ) => {
		if ( this.lock ) {
			if ( this.lock.path !== mailbox ) {
				throw new Error( 'Cannot switch mailbox while locked.' );
			}

			return await callback();
		}

		// Select and lock a mailbox. Throws if mailbox does not exist
		const opts = {
			readOnly: ! write,
		};
		this.lock = await this.imap.getMailboxLock( mailbox, opts );

		if ( ! this.imap.mailbox ) {
			throw new Error( `Could not select ${ mailbox }`, );
		}

		let result: T;
		try {
			result = await callback();
		} finally {
			this.lock.release();
			this.lock = null;
		}

		return result;
	}
	withLock = this._withLock( false );
	withWriteLock = this._withLock( true );

	async getMailboxThreads( mailbox: string ) {
		return await this.withLock( mailbox, async () => {
			const threads: { [ k: string]: Thread } = {};
			for await ( const msg of this.imap.fetch( '1:*', { uid: true, internalDate: true, threadId: true } ) ) {
				if ( ! msg.threadId || ! msg.internalDate ) {
					continue;
				}

				if ( ! threads[ msg.threadId ] ) {
					threads[ msg.threadId ] = {
						id: msg.threadId,
						messages: [],
						date: msg.internalDate,
					};
				}

				threads[ msg.threadId ].messages.push( msg.uid );
				if ( msg.internalDate > threads[ msg.threadId ].date! ) {
					threads[ msg.threadId ].date = msg.internalDate;
				}
			}

			return Object.values( threads );
		} );
	}

	async fetchPreviews( mailbox: string, messages: Message[] ) {
		return this.withLock( mailbox, () => {
			return Promise.all( messages.map( async ( message ): Promise<PartialMessage | null> => {
				if ( ! message.contentParts ) {
					return null;
				}

				const parts = message.contentParts;
				if ( parts.length < 1 ) {
					console.log( message );
					return null;
				}

				const part = parts[ parts.length - 1 ];
				const opts: FetchQueryObject = {
					bodyParts: [
						part.part,
					],
				};

				const data = await this.imap.fetchOne( `${ message.uid }`, opts, { uid: true } );
				if ( ! data.bodyParts ) {
					return null;
				}

				const summary = summarizeBodyPart( data.bodyParts, part );
				if ( ! summary ) {
					return null;
				}

				return {
					id: message.id,
					summary,
				};
			} ) );
		} );
	}

	async fetchMessagesByUid( mailbox: string, ids: Number[] ): Promise<Message[]> {
		const opts: FetchQueryObject = {
			bodyStructure: true,
			envelope: true,
			flags: true,
			headers: [
				'Content-Type',
			],
			labels: true,
			threadId: true,
		};

		return this.withLock( mailbox, async () => {
			const messages: Message[] = [];
			const sequence = ids.join( ',' );
			for await ( let message of this.imap.fetch( sequence, opts, { uid: true } ) ) {
				// rawMessages.push( message );
				const converted = messageFromImap( message );
				if ( ! converted ) {
					continue;
				}

				messages.push( converted );
			}

			return messages;
		} );
	}

	async fetchThreadMessageDetails( mailbox: string, thread: string ): Promise<MessageDetails[]> {
		// Select and lock a mailbox. Throws if mailbox does not exist
		return this.withLock( mailbox, async () => {
			// Find all messages in the thread.
			const search = {
				threadId: thread,
			};
			const ids = await this.imap.search( search, { uid: true } );
			if ( ! ids ) {
				return [];
			}

			const peekOpts: FetchQueryObject = {
				bodyStructure: true,
			};

			const opts: FetchQueryObject = {
				bodyStructure: true,
				envelope: true,
				flags: true,
				headers: true,
				labels: true,
				source: true,
				threadId: true,
			};

			const sequence = ids.join( ',' );
			const fetchers = {};
			for await ( let peeked of this.imap.fetch( sequence, peekOpts, { uid: true } ) ) {
				const contentParts = findContentParts( peeked.bodyStructure! );
				fetchers[ peeked.uid ] = contentParts?.map( part => part.part );
			}

			const messages: MessageDetails[] = [];
			const promisables = ids.map( id => {
				const specificOpts: FetchQueryObject = {
					...opts,
					bodyParts: fetchers[ id as number ] || null,
				};

				return this.imap.fetchOne( `${ id }`, specificOpts, { uid: true } );
			} );
			for await ( let message of promisables ) {
				const converted = messageFromImap( message );
				if ( ! converted ) {
					continue;
				}

				// Add body data.
				const fullMessage: MessageDetails = {
					...converted,
					body: decodeMessageBody( message )!,
				};

				messages.push( fullMessage );
			}

			return messages;
		} );
	}

	async fetchNewMessages( mailbox: string, previous: number, count: number ) {
		const opts: FetchQueryObject = {
			bodyStructure: true,
			envelope: true,
			flags: true,
			headers: [
				'Content-Type',
			],
			labels: true,
			threadId: true,
		};

		return this.withLock( mailbox, async () => {
			const messages: Message[] = [];
			const start = previous + 1;
			const sequence = start !== count ? `${ start }:${ count }` : `${ count }`;
			for await ( let message of this.imap.fetch( sequence, opts, { uid: false } ) ) {
				// rawMessages.push( message );
				const converted = messageFromImap( message );
				if ( ! converted ) {
					continue;
				}

				messages.push( converted );
			}

			return messages;
		} );
	}

	async setRead( mailbox: string, messages: Message[] ) {
		return this.withWriteLock( mailbox, async () => {
			const ids = messages.map( message => message.uid );
			return await this.imap.messageFlagsAdd( ids, [ '\\Seen' ], {
				uid: true,
			} );
		} );
	}
}
