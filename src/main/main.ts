import { app, ipcMain, shell } from 'electron';

import App from './app';
import { FrontendInitiatedEvent, Invokable } from '../common/ipc';

// Enable reloading.
// try {
// 	const mod = {
// 		...module,
// 		filename: __filename,
// 	};
// 	require( 'electron-reloader' )( mod, {
// 		debug: true,
//         watchRenderer: false,
//     } );
// } catch ( err ) {
// }

let appHandler: App | null = null;

const installExtensions = async () => {
	const installer = require('electron-devtools-installer');
	const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
	const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

	return Promise.all(
		extensions.map(name => installer.default(installer[name], forceDownload))
	).catch(console.log);
};

async function init() {
	if (process.env.NODE_ENV !== 'production') {
		await installExtensions();
	}

	appHandler = new App();
}

app.allowRendererProcessReuse = true;
app.whenReady().then( init );

// Attach global events.
app.on( 'window-all-closed', () => {
	app.quit();
} );
app.on( 'activate', () => {
	appHandler?.onActivate();
} );
app.on( 'before-quit', () => {
	appHandler?.onQuit();
} );
app.on( 'web-contents-created', ( _, contents ) => {
	if (contents.getType() !== 'webview') {
		return;
	}

	// Handle browsing inside a webview.
	const handleLink = ( event: Electron.Event, url: string ) => {
		event.preventDefault();
		shell.openExternal( url );
	};
	contents.on( 'will-navigate', handleLink );
	contents.on( 'new-window', handleLink );

	// Receive height from the window, and pass to the renderer.
	contents.on( 'ipc-message', ( _, channel, value: number | null ) => {
		if ( channel !== 'SET_HEIGHT' ) {
			return;
		}

		if ( value ) {
			appHandler?.send( {
				event: 'webview-height',
				data: {
					id: contents.id,
					height: Number( value ),
				}
			} );
		}
	} );

	// Insert default CSS.
	contents.on( 'did-finish-load', () => {
		contents.insertCSS( `
			html {
				font: 0.875em/1.5 Helvetica, sans-serif;
				color: #333;
			}
			body {
				margin: 0;
			}
		` );
	} );
} );

// Build type-safe object of events.
// (This uses an object so we can check for missing/extra properties.)
type EventType = FrontendInitiatedEvent["event"];
type EventTypeObj = Record<EventType, boolean>;
const eventTypes: EventTypeObj = {
	addAccount: true,
	archiveMessages: true,
	query: true,
	queryThreadDetails: true,
    reload: true,
	save: true,
	setRead: true,
};

Object.keys( eventTypes ).forEach( event => {
	ipcMain.on( event, ( _, data ) => {
		appHandler?.receive( {
			event: event as EventType,
			data,
		} );
	} );
} );

type InvokableCommand = Invokable["command"];
type InvokableCommandObj = Record<InvokableCommand, boolean>;
const invokableCommands: InvokableCommandObj = {
	minimizeWindow: true,
	maximizeWindow: true,
	restoreWindow: true,
	closeWindow: true,
	startGmailOauth: true,
	verifyAccount: true,
};
Object.keys( invokableCommands ).forEach( command => {
	ipcMain.handle( command, async ( _, data ) => {
		return await appHandler?.invoke( {
			command: command as InvokableCommand,
			data,
		} );
	} );
} );

process.on( 'uncaughtException', error => {
	console.warn( 'Unhandled Error', error );
} );

process.on( 'unhandledRejection', error => {
	console.warn( 'Unhandled Promise Rejection', error );
} );
