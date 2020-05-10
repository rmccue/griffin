import { remote } from 'electron';
import fs from 'fs';
import path from 'path';
import pify from 'pify';
import React from 'react';

export interface Plugin {
	id: string;
	name: string;
	component: React.FC;
}

export interface PluginMeta {
	id: string;
	data: any;
	type: 'user' | 'bundled',
	load: () => Promise<Plugin>,
}

export type PluginMetaMap = {
	[ k: string ]: PluginMeta;
}

const bundled = [
	'mailing-list',
];

// todo: replace use of remote
export const pluginRootDir = path.join( remote.app.getPath( 'userData' ), 'plugins' );

// Pify readdir, keeping types.
type FsParams = Parameters<typeof fs.readdir>;
const readdir: ( path: FsParams[0], options?: FsParams[1] ) => Promise<string[]> = pify( fs.readdir );

async function getAvailableForDir( dir: string ): Promise<PluginMetaMap> {
	const available: PluginMetaMap = {};
	const entries = await readdir( dir );
	for ( const entry of entries ) {
		const full = path.join( dir, entry );
		const stat = fs.statSync( full );
		if ( ! stat.isDirectory() ) {
			continue;
		}

		// Check if a root exists.
		// todo: use package.json?
		const rootPath = path.join( dir, entry, 'package.json' );
		try {
			fs.statSync( rootPath );
		} catch ( err ) {
			continue;
		}

		// Clear Node's cache!
		delete __non_webpack_require__.cache[ rootPath ];
		const packageJson = __non_webpack_require__( rootPath );

		available[ entry ] = {
			type: 'user',
			id: `${ packageJson.publisher }.${ packageJson.name }`,
			data: packageJson,
			load: async () => __non_webpack_require__( rootPath ),
		};
	}

	return available;
}

async function getAvailableBundled(): Promise<PluginMetaMap> {
	const available: PluginMetaMap = {};
	for ( const plugin of bundled ) {
		const packageJson = ( await import( `./plugins/${ plugin }/package.json` ) ).default;
		available[ plugin ] = {
			type: 'bundled',
			id: `${ packageJson.publisher }.${ packageJson.name }`,
			data: packageJson,
			load: async () => {
				const mod = await import( `./plugins/${ plugin }` );
				return mod.default;
			},
		};
	}
	return available;
}

export async function getAvailable(): Promise<PluginMetaMap> {
	console.log( 'gettingAvail' );
	let user: PluginMetaMap = {};
	try {
		user = await getAvailableForDir( pluginRootDir );
	} catch ( err ) {
		// No plugin directory, skip.
	}

	const bundled = await getAvailableBundled();

	return {
		...bundled,
		...user,
	};
}