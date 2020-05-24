import { remote } from 'electron';
import fs from 'fs';
import path from 'path';
import pify from 'pify';
import React from 'react';

import { overrideRequire } from './plugin/modules';

export interface Plugin {
	id: string;
	data: any;
	type: 'user' | 'bundled',
	load: () => Promise<React.ComponentType>,
}

export type PluginMap = {
	[ k: string ]: Plugin;
}

const bundled = [
	'mailing-list',
];

// todo: replace use of remote
export const pluginRootDir = path.join( remote.app.getPath( 'userData' ), 'plugins' );

// Pify readdir, keeping types.
type FsParams = Parameters<typeof fs.readdir>;
const readdir: ( path: FsParams[0], options?: FsParams[1] ) => Promise<string[]> = pify( fs.readdir );

/**
 * Patch require for plugins.
 *
 * Allows using require( '@rmccue/griffin/...' ) for any internal modules.
 */
export function patchRequire() {
	const Module = __non_webpack_require__( 'module' );
	const originalLoader = Module._load;
	Module._load = function ( request: string, parent: any, isMain: any ) {
		const res = overrideRequire( request );
		if ( res ) {
			return res;
		}

		return originalLoader.apply( this, arguments );
	};
}

async function getAvailableForDir( dir: string ): Promise<PluginMap> {
	const available: PluginMap = {};
	const entries = await readdir( dir );
	for ( const entry of entries ) {
		const full = path.join( dir, entry );
		const stat = fs.statSync( full );
		if ( ! stat.isDirectory() ) {
			continue;
		}

		// Check if a root exists.
		// todo: use package.json?
		const packageJsonPath = path.join( dir, entry, 'package.json' );
		try {
			fs.statSync( packageJsonPath );
		} catch ( err ) {
			continue;
		}

		// Clear Node's cache!
		delete __non_webpack_require__.cache[ packageJsonPath ];
		const packageJson = __non_webpack_require__( packageJsonPath );
		const rootPath = path.join( dir, entry, packageJson.main || 'index.js' );

		available[ entry ] = {
			type: 'user',
			id: `${ packageJson.publisher }.${ packageJson.name }`,
			data: packageJson,
			load: async () => __non_webpack_require__( rootPath ),
		};
	}

	return available;
}

async function getAvailableBundled(): Promise<PluginMap> {
	const available: PluginMap = {};
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

export async function getAvailable(): Promise<PluginMap> {
	console.log( 'gettingAvail' );
	let user: PluginMap = {};
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
