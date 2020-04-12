import keyBy from 'lodash/keyBy';

import {
	DELETED_MESSAGE,
	DeletedMessageAction,
	PushedMessagesAction,
	PUSHED_MESSAGES
} from '../../common/actions/messages';
import { ThreadsAction, QUERY_THREADS } from '../../common/actions/threads';
import { Thread } from '../../common/types';

export interface ThreadsState {
	items: Thread[];
}

const defaultState = {
	items: [],
};

type Action = ThreadsAction | DeletedMessageAction | PushedMessagesAction;

export default function threads( state: ThreadsState = defaultState, action: Action ): ThreadsState {
	switch ( action.type ) {
		case QUERY_THREADS:
			return {
				...state,
				items: action.payload.threads,
			};

		case DELETED_MESSAGE:
		case PUSHED_MESSAGES: {
			// Extract threads from the pushed items.
			const keyedItems = keyBy( state.items, 'id' );
			action.payload.changedThreads.forEach( thread => {
				keyedItems[ thread.id ] = thread;
			} );

			if ( ( action as DeletedMessageAction ).payload.removedThreads ) {
				( action as DeletedMessageAction ).payload.removedThreads.forEach( id => {
					delete keyedItems[ id ];
				} );
			}

			return {
				...state,
				items: Object.values( keyedItems ),
			};
		}

		default:
			return state;
	}
}
