import debug from 'debug';
import { BrowserWindow } from 'electron';
import storage from 'electron-json-storage';
import * as path from 'path';
import * as url from 'url';

import Account from './account';
import { connect } from './mailer';
import { BackendInitiatedEvent, FrontendInitiatedEvent } from '../common/ipc';

const STORAGE_KEY = 'store';

const log = debug( 'app' );

export default class App {
	// accounts: { [k: string]: Account } = {};
	// currentAccount?: Account;
	account?: Account;
	mailer?: ReturnType<typeof connect>;
	isReady: boolean = false;
	queue: BackendInitiatedEvent[] = [];
	win!: BrowserWindow | null;

	constructor() {
		this.createWindow();
	}

	createWindow = () => {
		this.win = new BrowserWindow( {
			width: 800,
			height: 600,
			show: false,
			webPreferences: {
				enableRemoteModule: true,
				nodeIntegration: true,
				webviewTag: true,
			},
			// titleBarStyle: 'hidden',
			titleBarStyle: 'hiddenInset',
		} );
		this.win.maximize();

		this.win.once( 'ready-to-show', () => {
			this.win?.show();
		} );

		this.attachWindowEvents();
		this.loadPage();
	}

	loadPage() {
		if ( ! this.win ) {
			return;
		}

		if ( process.env.NODE_ENV !== 'production' ) {
			this.win.loadURL( `http://localhost:2003` );
		} else {
			this.win.loadURL(
				url.format( {
					pathname: path.join(__dirname, 'index.html'),
					protocol: 'file:',
					slashes: true
				} )
			);
		}

	}

	attachWindowEvents() {
		if ( ! this.win ) {
			return;
		}

		// Load configuration from storage immediately.
		this.onReload();

		this.account = new Account( this );

		// Begin loading messages immediately.
		this.loadMessages();

		this.win.webContents.once( 'dom-ready', () => {
			// Open DevTools, see https://github.com/electron/electron/issues/12438 for why we wait for dom-ready
			if (process.env.NODE_ENV !== 'production') {
				this.win?.webContents.openDevTools();
			}

			this.isReady = true;
			this.sendQueued();
		} );

		this.win.on( 'closed', () => {
			this.win = null;
		} );

		this.win.webContents.on( 'did-navigate-in-page', this.onNavigate );
	}

	async disconnectImap() {
		if ( ! this.account ) {
			return;
		}

		await this.account.disconnect();
	}

	onActivate() {
		if ( this.win === null ) {
			this.createWindow();
		}
	}

	onNavigate = () => {
		if ( ! this.win ) {
			return;
		}

		const status = {
			canGoBack: this.win.webContents.canGoBack(),
			canGoForward: this.win.webContents.canGoForward(),
		};
		log( 'navigated' );
		this.send( {
			event: 'historyStateEvent',
			data: status,
		} );
	}

	async onQuit() {
		await this.disconnectImap();
	}

	onReload() {
		storage.get( STORAGE_KEY, ( err, data ) => {
			if ( err ) {
				console.warn( err );
				return;
			}

			this.send( {
				event: 'dispatch',
				data: {
					type: 'SYNC',
					payload: data,
				},
			} );
		})
	}

	loadMessages = async () => {
		if ( ! this.account ) {
			return;
		}

		await this.account.connect();
		this.account.queryThreads();
	}

	send( event: BackendInitiatedEvent ) {
		if ( ! this.win || ! this.isReady ) {
			log( `queueing ${ event.event }` );
			this.queue.push( event );
			return;
		}

		log( `sending ${ event.event }` );
		this.win.webContents.send( event.event, event.data );
	}

	sendQueued() {
		if ( ! this.win ) {
			return;
		}

		for ( const event of this.queue ) {
			log( `sending queued ${ event.event }` );
			this.win.webContents.send( event.event, event.data );
		}
	}

	receive( event: FrontendInitiatedEvent ) {
		log( `received ${ event.event }` );

		switch ( event.event ) {
			case 'save':
				storage.set( STORAGE_KEY, event.data, err => {
					if ( err ) {
						console.warn( err );
					}
				} );

				break;

			case 'reload':
				this.onReload();
				break;

			case 'query':
				this.loadMessages();
				break;

			case 'queryThreadDetails':
				this.account?.queryThreadDetails( event.data.thread );
				break;

			case 'setRead':
				this.account?.setRead( event.data.messages );
				break;

			default:
				// Force exhaustive type checks.
				const _exhaustiveCheck: never = event;
				console.warn( `Unknown event ${ _exhaustiveCheck }` );
				break;
		}
	}
}
