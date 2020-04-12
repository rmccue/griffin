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
			action.payload.forEach( message => {
				const thread = message.thread;
				if ( ! thread ) {
					return;
				}

				if ( ! keyedItems[ thread ] ) {
					keyedItems[ thread ] = {
						id: thread,
						messages: [],
						date: message.date,
					};
				}

				keyedItems[ thread ].messages.push( message.uid );
				if ( message.date! > keyedItems[ thread ].date! ) {
					keyedItems[ thread ].date = message.date;
				}
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
