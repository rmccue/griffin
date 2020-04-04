import { Storage } from 'redux-persist';

type StorageKey = 'root';

interface CustomStorage extends Storage {
	getItem( key: StorageKey ): Promise<string | null>;
	setItem( key: StorageKey, item: string ): Promise<void>;
	removeItem( key: StorageKey ): Promise<void>;
}

const CustomStorage: CustomStorage = {
	async getItem( key ) {
		console.log( 'get', key );
		return null;
	},

	async setItem( key, item ) {
		switch ( key ) {
			case 'root':
				console.log( 'set', key, item );
				break;

			default:
				throw new Error( 'Cannot persist unknown key' );
		}
	},

	async removeItem( key ) {
		console.log( 'remove', key );
		return;
	},
}

export default CustomStorage;
