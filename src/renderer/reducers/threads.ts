import { ThreadsAction, QUERY_THREADS } from '../../common/actions/threads';
import { Thread } from '../../common/types';

export interface ThreadsState {
	items: Thread[];
}

const defaultState = {
	items: [],
};

export default function threads( state: ThreadsState = defaultState, action: ThreadsAction ): ThreadsState {
	switch ( action.type ) {
		case QUERY_THREADS:
			return {
				...state,
				items: action.payload.threads,
			};

		default:
			return state;
	}
}
