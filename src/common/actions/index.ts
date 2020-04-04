import { MessagesAction } from './messages';
import { ThreadsAction } from './threads';

interface SyncAction {
	type: 'SYNC',
	payload: object,
}

export type Action =
	MessagesAction |
	SyncAction |
	ThreadsAction;

export type RootActions = Action[keyof Action];
