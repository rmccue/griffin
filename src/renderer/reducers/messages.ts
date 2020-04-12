import keyBy from 'lodash/keyBy';
import uniqBy from 'lodash/uniqBy';

import { ThreadsAction, QUERY_THREADS_MESSAGES } from '../../common/actions/threads';
import {
	MessagesAction,
	PUSHED_MESSAGES,
	QUERY_THREAD_DETAILS,
	RECEIVE_MESSAGES,
	UPDATE_MESSAGES
} from '../../common/actions/messages';
import { Message, MessageDetails } from '../../common/types';

export interface MessagesState {
	details: MessageDetails[],
	items: Message[];
}

const defaultState = {
	details: [],
	items: [],
};

export default function messages( state: MessagesState = defaultState, action: MessagesAction | ThreadsAction ): MessagesState {
	switch ( action.type ) {
		case PUSHED_MESSAGES:
		case QUERY_THREADS_MESSAGES:
			return {
				...state,
				items: uniqBy(
					[
						...( action.payload.messages || [] ),
						...state.items,
					],
					i => i.id
				),
			};

		case QUERY_THREAD_DETAILS:
			return {
				...state,
				details: uniqBy(
					[
						...( action.payload || [] ),
						...state.details,
					],
					i => i.id
				),
			};

		case RECEIVE_MESSAGES:
			return {
				...state,
				items: action.payload,
			};

		case UPDATE_MESSAGES: {
			const keyedItems = keyBy( state.items, 'id' );
			action.payload.forEach( item => {
				keyedItems[ item.id ] = {
					...keyedItems[ item.id ],
					...item,
				};
			} );
			return {
				...state,
				items: Object.values( keyedItems ),
			};
		}

		default:
			// Force exhaustive type checks.
			const _exhaustiveCheck: ThreadsAction = action;
			return state;
	}
}
