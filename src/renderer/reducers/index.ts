import { combineReducers, AnyAction } from 'redux';

import { Action } from '../../common/actions';
import accounts from './accounts';
import messages from './messages';
import preferences from './preferences';
import threads from './threads';

const combinedReducers = combineReducers( {
	accounts,
	messages,
	preferences,
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
