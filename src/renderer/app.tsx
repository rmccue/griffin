import { ipcRenderer } from 'electron';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { AppContainer } from 'react-hot-loader';

import { BackendInitiatedEvent } from '../common/ipc';
import Application from './components/Application';
import { receive, willUnload } from './connector';
import { patchRequire } from './plugin';
import { Provider as SlotFillProvider } from './slot-fill';
import store from './store';

import './app.css';

// Create main element
const mainElement = document.createElement('div');
mainElement.id = 'main';
document.body.appendChild( mainElement );

// Prepare plugin infrastructure.
patchRequire();

// Render components
const render = ( Component: React.ComponentType ) => {
	ReactDOM.render(
		<AppContainer>
			<Provider store={store}>
				<IntlProvider locale={ navigator.language }>
					<SlotFillProvider>
						<Component />
					</SlotFillProvider>
				</IntlProvider>
			</Provider>
		</AppContainer>,
		mainElement
	);
};

render( Application );

// Build type-safe object of events.
// (This uses an object so we can check for missing/extra properties.)
type EventType = BackendInitiatedEvent["event"];
type ActionTypeObj = Record<EventType, boolean>;
const actionTypes: ActionTypeObj = {
	dispatch: true,
	historyStateEvent: true,
	"webview-height": true,
};

// Add handlers for every event.
Object.keys( actionTypes ).forEach( event => {
	ipcRenderer.on( event, ( _, action ) => {
		receive( {
			event: event as EventType ,
			data: action,
		} );
	} );
} );

// Let the main process know if we're closing.
window.addEventListener( 'beforeunload', willUnload );
