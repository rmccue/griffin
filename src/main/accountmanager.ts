import { v5 } from 'uuid';

import Account from './account';
import App from './app';
import store from './store';
import { AccountConnectionStatus, AccountOptions, ConnectionOptions } from '../common/types';

const UUID_NAMESPACE = 'de4e7c90-95ed-47d2-8c2f-10a5c08c1991';
const ACCOUNTS_KEY = 'accounts';

type AccountMap = {
	[ k: string ]: Account;
}

type StoredData = {
	selected: string | null;
	accounts: {
		[ k: string ]: AccountOptions;
	}
}

export default class AccountManager {
	app: App;
	data: AccountMap = {};
	selectedId: string | null = null;

	constructor( app: App ) {
		this.app = app;
	}

	async load() {
		const data: StoredData = await store.get( ACCOUNTS_KEY );
		if ( ! data.accounts ) {
			return;
		}

		for ( const id of Object.keys( data.accounts ) ) {
			const account = new Account( this.app, data[ id ] );
			this.data[ id ] = account;
		}
		this.selectedId = data.selected;
	}

	getData() {
		const dataMap: StoredData = {
			selected: this.selectedId,
			accounts: {},
		};
		for ( const id of Object.keys( this.data ) ) {
			dataMap.accounts[ id ] = this.data[ id ].options;
		}
		return dataMap;
	}

	async save() {
		const data = this.getData();
		await store.set( ACCOUNTS_KEY, data );
	}

	add( account: Account ) {
		const id = v5( account.options.connection.auth.user, UUID_NAMESPACE );
		this.data[ id ] = account;
		return id;
	}

	async verify( options: ConnectionOptions ): Promise<AccountConnectionStatus> {
		const account = new Account( this.app, {
			connection: options,
		} );

		try {
			await account.connect();
		} catch ( err ) {
			if ( err.authenticationFailed ) {
				return {
					error: {
						type: 'authentication_failed',
					}
				};
			}

			console.log( err );
			return {
				error: {
					type: 'unknown',
				},
			};
		} finally {
			// Close any lingering connections.
			account.disconnect();
		}

		return {
			error: false,
		};
	}

	select( id: string ) {
		if ( ! this.data[ id ] ) {
			throw new Error( 'Invalid ID' );
		}

		this.selectedId = id;
	}

	selected() {
		if ( ! this.selectedId ) {
			return null;
		}

		return this.data[ this.selectedId ];
	}
}
