import { Action } from './actions';
import { AccountOptions, ConnectionOptions, Message } from './types';

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

export interface AddAccount {
	event: 'addAccount',
	data: AccountOptions,
}

export interface ArchiveMessages {
	event: 'archiveMessages',
	data: {
		messages: Message[],
	}
}

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

export interface WillUnloadEvent {
	event: 'willUnload',
}

export type FrontendInitiatedEvent =
	AddAccount |
	ArchiveMessages |
	QueryEvent |
	QueryThreadDetails |
	ReloadEvent |
	SetReadEvent |
	SaveEvent |
	WillUnloadEvent;

export interface StartGmailOauthCommand {
	command: 'startGmailOauth',
	data?: undefined;
}

export interface MinimizeWindowCommand {
	command: 'minimizeWindow';
	data?: undefined;
}

export interface MaximizeWindowCommand {
	command: 'maximizeWindow';
	data?: undefined;
}

export interface RestoreWindowCommand {
	command: 'restoreWindow';
	data?: undefined;
}

export interface CloseWindowCommand {
	command: 'closeWindow';
	data?: undefined;
}

export interface VerifyAccountCommand {
	command: 'verifyAccount',
	data: ConnectionOptions,
}

export type Invokable =
	MinimizeWindowCommand |
	MaximizeWindowCommand |
	RestoreWindowCommand |
	CloseWindowCommand |
	StartGmailOauthCommand |
	VerifyAccountCommand;
