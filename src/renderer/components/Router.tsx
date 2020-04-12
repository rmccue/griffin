import React, { createContext, useContext } from 'react';
import { HashRouter } from 'react-router-dom';
import { LastLocationProvider } from 'react-router-last-location';

type HistoryState = {
	canGoBack: boolean;
	canGoForward: boolean;
};

const defaultHistoryState = {
	canGoBack: false,
	canGoForward: false,
};

const HistoryContext = createContext( defaultHistoryState );
export const HistoryProvider = HistoryContext.Provider;
export const useHistoryState = () => useContext( HistoryContext );

interface Props {
	children: React.ReactNode,
};

type HistoryStateEvent = CustomEvent & {
	detail: HistoryState;
}

declare global {
	interface Window {
		addEventListener( event: 'historyState', listener: ( event: HistoryStateEvent ) => void, options: false ): void;
		removeEventListener( event: 'historyState', listener: ( event: HistoryStateEvent ) => void, options: false ): void;
	}
}

export default class Router extends React.Component<Props> {
	state = {
		history: defaultHistoryState as HistoryState,
	}

	componentDidMount() {
		console.log( 'mounting' );
		window.addEventListener( 'historyState', this.onHistoryStateChange, false );
	}

	componentWillUnmount() {
		window.removeEventListener( 'historyState', this.onHistoryStateChange, false );
	}

	onHistoryStateChange = ( event: HistoryStateEvent ) => {
		this.setState( {
			history: event.detail,
		} );
	}

	render() {
		return (
			<HashRouter>
				<LastLocationProvider>
					<HistoryContext.Provider value={ this.state.history }>
						{ this.props.children }
					</HistoryContext.Provider>
				</LastLocationProvider>
			</HashRouter>
		);
	}
}
