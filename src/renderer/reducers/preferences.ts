import uniq from 'lodash/uniq';
import without from 'lodash/without';

import { PreferencesAction } from '../../common/actions/preferences';
import { AccountOptions } from '../../common/types';

export interface PreferencesState {
	plugins: string[];
}

const DEFAULT_STATE: PreferencesState = {
	plugins: [],
};

export default function accounts( state: PreferencesState = DEFAULT_STATE, action: PreferencesAction ) {
	switch ( action.type ) {
		case 'ACTIVATE_PLUGIN':
			return {
				...state,
				plugins: uniq( [
					...state.plugins,
					action.payload.id,
				] ),
			};

		case 'DEACTIVATE_PLUGIN':
			return {
				...state,
				plugins: without( state.plugins, action.payload.id ),
			};

		default:
			const _exhaustiveCheck: never = action;
			return state;
	}
}
