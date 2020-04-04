import debug from 'debug';

const logOthers = debug( 'imap:others' );
const logClient = debug( 'imap:client' );
const logServer = debug( 'imap:server' );

type Level = 'debug' | 'info' | 'warn' | 'error' | 'trace' | 'fatal';

interface LogItem {
	src?: 'c' | 's' | string;
	cid?: string;
	[ key: string ]: any;
}

const log = ( level: Level ) => ( item: LogItem ) => {
	const { src, cid, msg, ...rest } = item;

	let logger: debug.Debugger;
	switch ( src ) {
		case 's':
			logger = logServer;
			break;

		case 'c':
			logger = logClient;
			break;

		default:
			// console.trace();
			logger = logOthers;
			break;
	}

	if ( Object.keys( rest ).length < 1 ) {
		logger( level, msg );
	} else if ( msg ) {
		logger( level, msg, rest );
	} else {
		logger( level, rest );
	}
}

const logger = {
	debug: log( 'debug' ),
	info: log( 'info' ),
	warn: log( 'warn' ),
	error: ( item: LogItem ) => {
		console.trace();
		return log( 'error' )( item );
	},
	trace: log( 'trace' ),
	fatal: log( 'fatal' ),
};

export default logger;
