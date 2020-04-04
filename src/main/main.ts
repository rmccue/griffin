import { app, ipcMain, shell } from 'electron';

import App from './app';
import { FrontendInitiatedEvent } from '../common/ipc';

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

	// Calculate the height inside the window, and pass to the renderer.
	contents.on( 'dom-ready', async () => {
		// Calculate height in an isolated world.
		const height = await contents.executeJavaScriptInIsolatedWorld( 240, [
			{
				code: 'document.documentElement.scrollHeight',
			}
		] );

		appHandler?.send( {
			event: 'webview-height',
			data: {
				id: contents.id,
				height,
			},
		} );
	} );
} );

// Build type-safe object of events.
// (This uses an object so we can check for missing/extra properties.)
type EventType = FrontendInitiatedEvent["event"];
type EventTypeObj = Record<EventType, boolean>;
const eventTypes: EventTypeObj = {
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

process.on( 'uncaughtException', error => {
	console.warn( 'Unhandled Error', error );
} );

process.on( 'unhandledRejection', error => {
	console.warn( 'Unhandled Promise Rejection', error );
} );
