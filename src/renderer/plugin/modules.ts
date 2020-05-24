import importAll from 'import-all.macro';

// Manual requires.
import * as Connector from '../connector';
import * as SlotFill from '../slot-fill';

const components = importAll.sync( '../components/*' );
const reducers = importAll.sync( '../reducers/*' );
const selectors = importAll.sync( '../selectors/*' );
const store = importAll.sync( '../store/*' );

declare var __griffin_webpack_ext__: string[];

/**
 * Resolve a module name against a component list.
 *
 * @param moduleName Requested module name (relative to root)
 * @param root Root to check, as a string (i.e. relative path from importAll call above)
 * @param moduleMap Module map from importAll.sync
 */
function resolve( moduleName: string, root: string, moduleMap: { [ k: string ]: any } ) {
	// Directory requires.
	if ( moduleMap[ root + moduleName ] ) {
		return moduleMap[ root + moduleName ];
	}

	// Check all available extensions.
	for ( const ext of __griffin_webpack_ext__ ) {
		const fullName = root + moduleName + ext;
		return moduleMap[ fullName ];
	}

	return null;
}

/**
 * Require an internal (@rmccue/griffin/...) module.
 *
 * @param request Requested module name (after `@rmccue/griffin` prefix)
 */
export function internalRequire( request: string ) {
	if ( request.startsWith( 'components/' ) ) {
		return resolve( request.substr( 11 ), '../components/', components );
	}
	if ( request.startsWith( 'reducers/' ) ) {
		return resolve( request.substr( 9 ), '../reducers/', reducers );
	}
	if ( request.startsWith( 'selectors/' ) ) {
		return resolve( request.substr( 10 ), '../selectors/', selectors );
	}
	if ( request.startsWith( 'store/' ) ) {
		return resolve( request.substr( 6 ), '../store/', store );
	}

	switch ( request ) {
		case 'connector':
			return Connector;

		case 'slot-fill':
			return SlotFill;
	}

	return null;
}

/**
 * Override the require statement.
 *
 * @param request Requested module name.
 */
export function overrideRequire( request: string ) {
	if ( request.startsWith( '@rmccue/griffin/' ) ) {
		const res = internalRequire( request.substr( 16 ) );
		if ( res ) {
			return res;
		}
	}

	// Check for any shared modules.
	switch ( request ) {
		case 'react':
			return require( 'react' );

		case 'react-dom':
			return require( 'react-dom' );

		default:
			return null;
	}
}
