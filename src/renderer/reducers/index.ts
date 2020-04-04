import { combineReducers, AnyAction } from 'redux';

import { Action } from '../../common/actions';
import messages from './messages';
import threads from './threads';

const combinedReducers = combineReducers( {
	messages,
	threads,

	// Add dummy reducer to satisfy the AnyAction type check.
	other: ( state: object = {}, _: AnyAction ) => state,
} );

export type RootState = ReturnType<typeof combinedReducers>;

export const rootReducer = ( state: RootState | undefined, action: Action | AnyAction ): RootState => {
	switch ( action.type ) {
		case 'SYNC':
			return {
				...state,
				...action.payload,
			};

		default:
			return combinedReducers( state, action );
	}
}
