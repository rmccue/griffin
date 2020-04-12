import debug from 'debug';
import findKey from 'lodash/findKey';
import keyBy from 'lodash/keyBy';
import sortBy from 'lodash/sortBy';

import App from './app';
import { Mailer, FlagUpdateEvent, NewMessagesEvent } from './mailer';
import { AccountOptions, Message, Thread, PartialMessage } from '../common/types';

type Mailbox = {
	threads: Thread[];
}

const log = debug( 'account' );

export default class Account {
	app: App;
	mailboxes: { [ k: string ]: Mailbox } = {};
	mailer: Mailer;
	options: AccountOptions;

	// Map of unique message ID => UID
	idMap: { [ k: string ]: number } = {};

	constructor( app: App, options: AccountOptions ) {
		this.app = app;
		this.options = options;
		this.mailer = new Mailer( options.connection );
		this.mailer.on( 'flags', this.onFlags );
		this.mailer.on( 'newMessages', this.onNewMessages );
	}

	async connect() {
		return await this.mailer.connect();
	}

	async disconnect() {
		return await this.mailer.disconnect();
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
}
