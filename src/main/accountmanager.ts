import ElectronGoogleOAuth2 from '@getstation/electron-google-oauth2';
import fetch from 'node-fetch';
import { v5 } from 'uuid';

import Account from './account';
import App from './app';
import store from './store';
import { AccountConnectionStatus, AccountOptions, ConnectionOptions, GmailAuth } from '../common/types';

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
			const account = new Account( this.app, data.accounts[ id ] );
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

	async startGmailOauth(): Promise<GmailAuth> {
		const myApiOauth = new ElectronGoogleOAuth2(
			process.env.GMAIL_CLIENT_ID!,
			process.env.GMAIL_CLIENT_SECRET!,
			[
				'https://mail.google.com/'
			],
			{
				loopbackInterfaceRedirectionPort: 9001,
				successRedirectURL: 'https://griffin.rmccue.io/connected',
			}
		);

		const token = await myApiOauth.openAuthWindowAndGetTokens();

		// Fetch the user's account details.
		const opts = {
			headers: {
				'Authorization': `${ token.token_type } ${ token.access_token }`,
			},
		};
		const profileRes = await fetch( 'https://www.googleapis.com/gmail/v1/users/me/profile', opts );
		const profile = await profileRes.json();
		if ( ! profileRes.ok ) {
			console.log( profile );
			if ( profile.error ) {
				console.log( profile.error );
			}

			throw new Error( 'Could not connect to Gmail' );
		}

		return {
			user: profile.emailAddress,
			token: {
				access_token: token.access_token!,
				refresh_token: token.refresh_token!,
				id_token: token.id_token!,
				token_type: token.token_type!,
				expiry_date: token.expiry_date!,
				scope: ( token as any ).scope,
			},
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
