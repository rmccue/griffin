import { AccountOptions } from '../types';

export interface LoadAccountsAction {
	type: 'LOAD_ACCOUNTS';
	payload: {
		[ k: string ]: AccountOptions;
	}
}

export type AccountsAction = LoadAccountsAction;
