// Embed in IIFE to protect against accidental scope leaks.
( () => {
	const sendHeight = value => require( 'electron' ).ipcRenderer.send( 'SET_HEIGHT', value );
	let lastHeight;
	setInterval( () => {
		const height = document.documentElement && document.documentElement.scrollHeight;
		if ( document.documentElement && height !== lastHeight ) {
			sendHeight( height );
			lastHeight = height;
		}
	}, 100 );
} )();
