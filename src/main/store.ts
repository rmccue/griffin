import storage, { DataOptions } from 'electron-json-storage';
import pify from 'pify';

interface AsyncStorage {
	getDefaultDataPath(): string;
	setDataPath(directory?: string): void;
	getDataPath(): string;
	get<T = object>(key: string, options?: DataOptions): Promise<T>;
	getMany<T = object>(keys: ReadonlyArray<string>, options?: DataOptions): Promise<T>;
	getAll<T = object>(options?: DataOptions): Promise<T>;
	set(key: string, json: object, options?: DataOptions): Promise<void>;
	has(key: string, options?: DataOptions): Promise<boolean>;
	keys(options?: DataOptions): Promise<string[]>;
	remove(key: string, options?: DataOptions): Promise<void>;
	clear(options?: DataOptions): Promise<void>;
}
const asyncStorage: AsyncStorage = pify( storage, {
	include: [
		'get',
		'getMany',
		'getAll',
		'set',
		'has',
		'keys',
		'remove',
		'clear',
	],
} );

export default asyncStorage;
