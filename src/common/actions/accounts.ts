import { AccountOptions } from '../types';

export interface AddAccountAction {
	type: 'ADD_ACCOUNT',
	payload: {
		id: string;
		options: AccountOptions;
	};
}

export interface LoadAccountsAction {
	type: 'LOAD_ACCOUNTS';
	payload: {
		[ k: string ]: AccountOptions;
	}
}

export type AccountsAction = AddAccountAction | LoadAccountsAction;
