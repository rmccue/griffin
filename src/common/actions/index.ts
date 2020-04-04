import { AccountsAction } from './accounts';
import { MessagesAction } from './messages';
import { ThreadsAction } from './threads';

interface SyncAction {
	type: 'SYNC',
	payload: object,
}

export type Action =
	AccountsAction |
	MessagesAction |
	SyncAction |
	ThreadsAction;

export type RootActions = Action[keyof Action];
