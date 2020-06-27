import debug from 'debug';
import { EventEmitter } from 'events';
import findKey from 'lodash/findKey';
import keyBy from 'lodash/keyBy';
import sortBy from 'lodash/sortBy';
import fetch from 'node-fetch';
import querystring from 'querystring';

import App from './app';
import {
	DeleteMessageEvent,
	FlagUpdateEvent,
	Mailer,
	NewMessagesEvent
} from './mailer';
import { AccountOptions, Message, Thread, PartialMessage } from '../common/types';

type Mailbox = {
	threads: Thread[];
}

type RefreshResponse = {
	access_token: string;
	expires_in: number;
	scope: string;
	token_type: string;
	id_token: string;
}

/**
 * Refresh tokens when they only have 5 mins remaining.
 */
const EXPIRATION_THRESHOLD = 300000;
const GMAIL_TOKEN_URL = 'https://oauth2.googleapis.com/token';

const log = debug( 'account' );

interface Account extends EventEmitter {
	emit( event: 'updatedOptions' ): boolean;
	on( event: 'updatedOptions', listener: () => void ): this;
	once( event: 'updatedOptions', listener: () => void ): this;
}

class Account extends EventEmitter {
	app: App;
	connected: boolean = false;
	expirationTimer?: NodeJS.Timeout;
	mailboxes: { [ k: string ]: Mailbox } = {};
	mailer!: Mailer;
	options: AccountOptions;

	// Map of unique message ID => UID
	idMap: { [ k: string ]: number } = {};

	constructor( app: App, options: AccountOptions ) {
		super();

		this.app = app;
		this.options = options;
		this.initMailer();
	}

	private initMailer() {
		this.mailer = new Mailer( this.options.connection );
		this.mailer.on( 'close', this.onClose );
		this.mailer.on( 'delete', this.onDelete );
		this.mailer.on( 'flags', this.onFlags );
		this.mailer.on( 'newMessages', this.onNewMessages );
	}

	async connect() {
		await this.checkToken();
		const res = await this.mailer.connect();
		this.connected = true;
		return res;
	}

	async disconnect() {
		if ( ! this.connected ) {
			return;
		}

		return await this.mailer.disconnect();
	}

	async checkToken() {
		if ( this.options.connection.service !== 'gmail' ) {
			return;
		}

		const token = this.options.connection.auth.token;
		if ( ! token.expiry_date ) {
			// Non-expiring token.
			return;
		}

		if ( token.expiry_date <= ( Date.now() - EXPIRATION_THRESHOLD ) ) {
			// Expired, refresh immediately.
			log( 'Token expired' );
			await this.refreshToken();
		}

		// Schedule for when the next expiration is.
		const expires = this.options.connection.auth.token.expiry_date - Date.now() - EXPIRATION_THRESHOLD;
		log( `Token will expire at ${ new Date( Date.now() + expires ) }` );
		if ( this.expirationTimer ) {
			clearTimeout( this.expirationTimer );
		}

		this.expirationTimer = setTimeout( () => {
			delete this.expirationTimer;
			this.checkToken();
		}, expires );
	}

	async refreshToken() {
		if ( this.options.connection.service !== 'gmail' ) {
			return;
		}

		log( 'Refreshing' );
		const refresh_token = this.options.connection.auth.token.refresh_token;
		const data = {
			client_id: process.env.GMAIL_CLIENT_ID!,
			client_secret: process.env.GMAIL_CLIENT_SECRET!,
			grant_type: 'refresh_token',
			refresh_token,
		};
		const opts = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: querystring.stringify( data ),
		};
		const resp = await fetch( GMAIL_TOKEN_URL, opts );
		const respData: RefreshResponse = await resp.json();
		if ( ! resp.ok ) {
			log( 'Could not refresh token', respData );
			throw new Error( 'Could not refresh token' );
		}

		if ( ! respData.access_token ) {
			log( 'Bad token response', respData );
			throw new Error( 'Missing critical token information' );
		}

		// Update the connection details.
		const nextOptions: AccountOptions = {
			...this.options,
			connection: {
				...this.options.connection,
				service: 'gmail',
				auth: {
					...this.options.connection.auth,
					token: {
						...this.options.connection.auth.token,
						access_token: respData.access_token,
						expiry_date: Date.now() + ( respData.expires_in * 1000 ),
					},
				},
			},
		};

		log( 'Refreshed token' );
		await this.updateAccountOptions( nextOptions );
	}

	onClose = async () => {
		log( 'Warning: disconnected from server' );
	}

	onDelete = async ( event: DeleteMessageEvent ) => {
		// Find the UID for the message.
		const uid = this.idMap[ event.id ];

		// Find any changed threads.
		const keyedItems = keyBy( this.mailboxes[ event.mailbox ].threads, 'id' );
		const changedThreads: Thread[] = [];
		const removedThreads: string[] = [];
		for ( const thread of this.mailboxes[ event.mailbox ].threads ) {
			const nextMessages = thread.messages.filter( m => m !== uid );
			if ( nextMessages.length === thread.messages.length ) {
				continue;
			}

			if ( nextMessages.length === 0 ) {
				// Remove the thread.
				delete keyedItems[ thread.id ];
				removedThreads.push( thread.id );
				continue;
			}

			// Update the thread.
			keyedItems[ thread.id ].messages = nextMessages;
			changedThreads.push( keyedItems[ thread.id ] );
		}
		this.mailboxes[ event.mailbox ].threads = Object.values( keyedItems );

		this.app.send( {
			event: 'dispatch',
			data: {
				type: 'DELETED_MESSAGE',
				payload: {
					id: event.id,
					changedThreads,
					removedThreads,
				},
			},
		} );
	}

	onFlags = async ( event: FlagUpdateEvent ) => {
		const uid = event.uid;

		// Find unique message ID.
		const messageId = findKey( this.idMap, item => item === uid );
		log( 'flags', uid, messageId, event.flags );
		if ( ! messageId ) {
			// We've never seen this message, so nothing to update.
			return;
		}

		// Convert to messages.
		const message: PartialMessage = {
			id: messageId,
			flags: event.flags,
		};
		this.app.send( {
			event: 'dispatch',
			data: {
				type: 'UPDATE_MESSAGES',
				payload: [
					message,
				],
			}
		} );
	}

	onNewMessages = async ( event: NewMessagesEvent ) => {
		if ( ! this.mailboxes[ event.mailbox ] ) {
			// Don't care about this mailbox.
			return;
		}

		// Extract the threads and store them.
		const keyedItems = keyBy( this.mailboxes[ event.mailbox ].threads, 'id' );
		const changedThreads = {};
		event.messages.forEach( message => {
			const thread = message.thread;
			if ( ! thread ) {
				return;
			}

			if ( ! keyedItems[ thread ] ) {
				keyedItems[ thread ] = {
					id: thread,
					messages: [],
					date: message.date,
				};
			}

			keyedItems[ thread ].messages.push( message.uid );
			if ( message.date! > keyedItems[ thread ].date! ) {
				keyedItems[ thread ].date = message.date;
			}
			changedThreads[ thread ] = keyedItems[ thread ];
		} );
		this.mailboxes[ event.mailbox ].threads = Object.values( keyedItems );

		this.app.send( {
			event: 'dispatch',
			data: {
				type: 'PUSHED_MESSAGES',
				payload: {
					messages: event.messages,
					changedThreads: Object.values( changedThreads ),
				},
			}
		} );
	}

	updateIdMap( messages: Message[] ) {
		for ( const message of messages ) {
			this.idMap[ message.id ] = message.uid;
		}
	}

	async updateAccountOptions( options: AccountOptions ) {
		const prevOptions = this.options;
		this.options = options;

		// Reconnect if needed.
		if ( this.options.connection !== prevOptions.connection ) {
			const needsReconnect = this.connected;
			if ( needsReconnect ) {
				await this.disconnect();
			}

			this.mailer = null!;
			this.initMailer();

			if ( needsReconnect ) {
				await this.connect();
			}
		}

		this.emit( 'updatedOptions' );
	}

	async getMailboxThreads( mailbox: string ) {
		if ( this.mailboxes[ mailbox ] && this.mailboxes[ mailbox ].threads ) {
			return this.mailboxes[ mailbox ].threads;
		}

		log( 'Fetching threads' );
		const threads = await this.mailer.getMailboxThreads( 'INBOX' );
		this.mailboxes[ mailbox ] = {
			threads,
		};
		return threads;
	}

	async queryThreads() {
		const threads = await this.getMailboxThreads( 'INBOX' );

		// Get the latest 50 threads.
		const newest = sortBy( threads, 'date' ).reverse().slice( 0, 50 );
		this.app.send( {
			event: 'dispatch',
			data: {
				type: 'QUERY_THREADS',
				payload: {
					threads: newest,
				},
			}
		} );

		// Get all messages for them.
		const allUids = newest.reduce( ( acc: Number[], thread ) => {
			return [
				...acc,
				...thread.messages,
			];
		}, [] );

		// Now, get all those messages.
		const messages = await this.mailer.fetchMessagesByUid( 'INBOX', allUids );
		this.app.send( {
			event: 'dispatch',
			data: {
				type: 'QUERY_THREADS_MESSAGES',
				payload: {
					messages,
				},
			},
		} );
		this.updateIdMap( messages );

		// Finally, fetch previews.
		const previews = await this.mailer.fetchPreviews( 'INBOX', messages );
		const previewableMessages = previews.filter( preview => preview !== null ) as PartialMessage[];
		this.app.send( {
			event: 'dispatch',
			data: {
				type: 'UPDATE_MESSAGES',
				payload: previewableMessages,
			}
		} );
	}

	async queryThreadDetails( thread: string ) {
		try {
			const threadDetails = await this.mailer.fetchThreadMessageDetails( 'INBOX', thread );
			if ( threadDetails ) {
				this.app.send( {
					event: 'dispatch',
					data: {
						type: 'QUERY_THREAD_DETAILS',
						payload: threadDetails,
					}
				} );
			}
		} catch ( err ) {
			console.log( err );
		}
	}

	async setRead( messages: Message[] ) {
		log( 'setRead', messages.map( m => m.id ) );
		const results = await this.mailer.setRead( 'INBOX', messages );
		if ( results ) {
			// Update the flags.
			const updates: PartialMessage[] = messages.map( message => {
				return {
					id: message.id,
					flags: {
						...message.flags,
						seen: true,
					},
				};
			} );
			this.app.send( {
				event: 'dispatch',
				data: {
					type: 'UPDATE_MESSAGES',
					payload: updates,
				}
			} );
		}
	}

	async archiveMessages( messages: Message[] ) {
		log( 'archiveMessages', messages.map( m => m.id ) );
		await this.mailer.deleteMessages( 'INBOX', messages );
	}
}

export default Account;
