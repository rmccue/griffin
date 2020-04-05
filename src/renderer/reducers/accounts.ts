import { AccountsAction } from '../../common/actions/accounts';
import { AccountOptions } from '../../common/types';

export interface AccountsState {
	loading: boolean;
	accounts: {
		[ k: string ]: AccountOptions;
	}
}

const DEFAULT_STATE: AccountsState = {
	loading: true,
	accounts: {},
};

export default function accounts( state: AccountsState = DEFAULT_STATE, action: AccountsAction ) {
	switch ( action.type ) {
		case 'LOAD_ACCOUNTS':
			return {
				...state,
				loading: false,
			};

		default:
			return state;
	}
}