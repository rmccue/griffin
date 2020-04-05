import { Action } from './actions';
import { ConnectionOptions, Message } from './types';

export interface DispatchEvent {
	event: 'dispatch';
	data: Action;
};

export interface HistoryStateEvent {
	event: 'historyStateEvent',
	data: {
		canGoBack: boolean;
		canGoForward: boolean;
	}
}

export interface WebviewHeightEvent {
	event: 'webview-height';
	data: {
		id: number;
		height: number;
	}
}

export type BackendInitiatedEvent = DispatchEvent | HistoryStateEvent | WebviewHeightEvent;

export interface QueryEvent {
	event: 'query',
};

export interface QueryThreadDetails {
	event: 'queryThreadDetails',
	data: {
		thread: string,
	},
};

export interface SetReadEvent {
	event: 'setRead',
	data: {
		messages: Message[],
	}
};

export interface ReloadEvent {
	event: 'reload',
};

export interface SaveEvent {
	event: 'save',
	data: object;
}

export type FrontendInitiatedEvent = QueryEvent | QueryThreadDetails | ReloadEvent | SetReadEvent | SaveEvent;

export interface VerifyAccountCommand {
	command: 'verifyAccount',
	data: ConnectionOptions,
}

export type Invokable = VerifyAccountCommand;
