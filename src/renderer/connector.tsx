import { ipcRenderer } from 'electron';

import store from './store';
import { BackendInitiatedEvent, FrontendInitiatedEvent, Invokable } from '../common/ipc';
import { AccountConnectionStatus, ConnectionOptions, Message } from '../common/types';

function send( event: FrontendInitiatedEvent ) {
	ipcRenderer.send( event.event, 'data' in event ? event.data : null );
}

async function invoke( command: Invokable ) {
	return await ipcRenderer.invoke( command.command, command.data );
}

type Resolver = ( ( value: number ) => void ) | null;

const webviewHeights: {
	[ k: number ]: {
		promise: Promise<number>,
		resolve: Resolver,
	}
} = {};

export function receive( event: BackendInitiatedEvent ) {
	switch ( event.event ) {
		case 'dispatch':
			store.dispatch( event.data );
			break;

		case 'historyStateEvent': {
			const windowEvent = new CustomEvent( 'historyState', {
				detail: event.data,
			} );
			window.dispatchEvent( windowEvent );
			break;
		}

		case 'webview-height':
			const { id, height } = event.data;
			if ( ! webviewHeights[ id ] ) {
				getWebviewHeight( id );
			}

			webviewHeights[ id ].resolve!( height );
			break;

		default:
			// Force exhaustive type checks.
			const _exhaustiveCheck: never = event;
			console.warn( `Unknown event ${ _exhaustiveCheck }` );
			break;
	}
}

export function _connect() {
	return true;
}

export function query() {
	send( {
		event: 'query',
	} );
}

export function queryThreadDetails( thread: string ) {
	send( {
		event: 'queryThreadDetails',
		data: {
			thread,
		},
	} );
}

export function reload() {
	send( { event: 'reload' } );
}

export function save() {
    const state = store.getState();
    if ( ! state ) {
        return;
	}

	send( {
		event: 'save',
		data: state,
	} );
}

export function setRead( messages: Message[] ) {
	send( {
		event: 'setRead',
		data: {
			messages
		},
	} );
}

export function getWebviewHeight( id: number ) {
	if ( webviewHeights[ id ] ) {
		return webviewHeights[ id ].promise;
	}

	let resolve: Resolver = null;
	const promise = new Promise<number>( res => { resolve = res } );
	webviewHeights[ id ] = {
		promise,
		resolve,
	};
	return promise;
}

export async function verifyAccount( options: ConnectionOptions ): Promise<AccountConnectionStatus> {
	return await invoke( {
		command: 'verifyAccount',
		data: options,
	} );
}
