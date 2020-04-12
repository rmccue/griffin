import keyBy from 'lodash/keyBy';

import { PushedMessagesAction, PUSHED_MESSAGES } from '../../common/actions/messages';
import { ThreadsAction, QUERY_THREADS } from '../../common/actions/threads';
import { Thread } from '../../common/types';

export interface ThreadsState {
	items: Thread[];
}

const defaultState = {
	items: [],
};

export default function threads( state: ThreadsState = defaultState, action: ThreadsAction | PushedMessagesAction ): ThreadsState {
	switch ( action.type ) {
		case QUERY_THREADS:
			return {
				...state,
				items: action.payload.threads,
			};

		case PUSHED_MESSAGES: {
			// Extract threads from the pushed items.
			const keyedItems = keyBy( state.items, 'id' );
			action.payload.changedThreads.forEach( thread => {
				keyedItems[ thread.id ] = thread;
			} );
			return {
				...state,
				items: Object.values( keyedItems ),
			};
		}

		default:
			return state;
	}
}
