import debug from 'debug';
import { BrowserWindow, BrowserWindowConstructorOptions } from 'electron';
import storage from 'electron-json-storage';
import * as path from 'path';
import * as url from 'url';

import Account from './account';
import AccountManager from './accountmanager';
import { BackendInitiatedEvent, FrontendInitiatedEvent, Invokable } from '../common/ipc';
import { AccountOptions } from '../common/types';

const STORAGE_KEY = 'store';

const log = debug( 'app' );

export default class App {
	accounts: AccountManager;
	isReady: boolean = false;
	queue: BackendInitiatedEvent[] = [];
	win!: BrowserWindow | null;

	constructor() {
		this.accounts = new AccountManager( this );

		this.load();
		this.createWindow();
	}

	async load() {
		await this.accounts.load();

		// Load configuration from storage immediately.
		this.onReload();

		// Begin loading messages immediately.
		// this.loadMessages();
		// TODO: trigger this early to ensure load starts ASAP.
	}

	createWindow = () => {
		const opts: BrowserWindowConstructorOptions = {
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
		};
		if ( process.env.IS_WINDOWS ) {
			opts.frame = false;
		}
		this.win = new BrowserWindow( opts );
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

		this.win.webContents.on( 'dom-ready', () => {
			// Open DevTools, see https://github.com/electron/electron/issues/12438 for why we wait for dom-ready
			if (process.env.NODE_ENV !== 'production') {
				this.win?.webContents.openDevTools();
			}

			this.onWindowInit();
		} );

		this.win.on( 'closed', () => {
			this.win = null;
		} );

		this.win.webContents.on( 'did-navigate-in-page', this.onNavigate );

		interface AttachWebPreferences extends Electron.WebPreferences {
			preloadURL: string;
		}
		this.win.webContents.on( 'will-attach-webview', ( _, pref, params ) => {
			( pref as AttachWebPreferences ).preloadURL = `file://${ __dirname }/content-injection.js`;
		} );
	}

	onWindowInit() {
		this.send( {
			event: 'dispatch',
			data: {
				type: 'LOAD_ACCOUNTS',
				payload: this.accounts.getData().accounts,
			},
		} );

		this.isReady = true;
		this.sendQueued();
	}

	async disconnectImap() {
		const selected = this.accounts.selected();
		if ( ! selected ) {
			return;
		}

		await selected.disconnect();
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

	addAccount( options: AccountOptions ) {
		const account = new Account( this, options );
		const id = this.accounts.add( account );

		// todo: have this driven by the renderer.
		this.accounts.select( id );

		this.send( {
			event: 'dispatch',
			data: {
				type: 'ADD_ACCOUNT',
				payload: {
					id,
					options,
				},
			}
		} );

		this.accounts.save();
	}

	loadMessages = async () => {
		const selected = this.accounts.selected();
		if ( ! selected ) {
			return;
		}

		await selected.connect();
		selected.queryThreads();
	}

	send( event: BackendInitiatedEvent ) {
		const name = event.event === 'dispatch' ? `${ event.event }:${ event.data.type }` : event.event;
		if ( ! this.win || ! this.isReady ) {
			log( `queueing ${ name }` );
			this.queue.push( event );
			return;
		}

		log( `sending ${ name }` );
		this.win.webContents.send( event.event, event.data );
	}

	sendQueued() {
		if ( ! this.win ) {
			return;
		}

		for ( const event of this.queue ) {
			const name = event.event === 'dispatch' ? `${ event.event }:${ event.data.type }` : event.event;
			log( `sending queued ${ name }` );
			this.win.webContents.send( event.event, event.data );
		}
	}

	receive( event: FrontendInitiatedEvent ) {
		log( `received ${ event.event }` );

		switch ( event.event ) {
			case 'addAccount':
				this.addAccount( event.data );
				break;

			case 'archiveMessages':
				this.accounts.selected()?.archiveMessages( event.data.messages );
				break;

			case 'save':
				storage.set( STORAGE_KEY, event.data, err => {
					if ( err ) {
						console.warn( err );
					}
				} );
				this.accounts.save();

				break;

			case 'reload':
				this.onReload();
				break;

			case 'query':
				this.loadMessages();
				break;

			case 'queryThreadDetails':
				this.accounts.selected()?.queryThreadDetails( event.data.thread );
				break;

			case 'setRead':
				this.accounts.selected()?.setRead( event.data.messages );
				break;

			case 'willUnload':
				this.isReady = false;
				break;

			default:
				// Force exhaustive type checks.
				const _exhaustiveCheck: never = event;
				console.warn( `Unknown event ${ _exhaustiveCheck }` );
				break;
		}
	}

	async invoke( command: Invokable ) {
		log( `invoking ${ command.command }` );

		switch ( command.command ) {
			case 'minimizeWindow':
				this.win?.minimize();
				break;

			case 'maximizeWindow':
				this.win?.maximize();
				break;

			case 'restoreWindow':
				this.win?.unmaximize();
				break;

			case 'closeWindow':
				this.win?.close();
				break;

			case 'verifyAccount':
				return await this.accounts.verify( command.data );

			case 'startGmailOauth':
				return await this.accounts.startGmailOauth();

			default:
				// const _exhaustiveCheck: never = command;
				// throw new Error( `Unknown command ${ _exhaustiveCheck }` );
				break;
		}
	}
}
