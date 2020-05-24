import React, { useState, useEffect } from 'react';

import { startGmailOauth } from '../../connector';
import { ConnectionOptions } from '../../../common/types';

interface Props {
	onCancel?: () => void;
	onCreate( options: ConnectionOptions ): void;
}

export default function ConnectImap( props: Props ) {
	const [ verifying, setVerifying ] = useState( false );
	const [ error, setError ] = useState<string | null>( null );

	const onConnect = async () => {
		setError( null );
		setVerifying( true );

		try {
			const credentials = await startGmailOauth();
			console.log( credentials );

			const connection: ConnectionOptions = {
				service: 'gmail',
				auth: credentials,
			};

			setVerifying( false );
			props.onCreate( connection );
		} catch ( err ) {
			setError( err );
			setVerifying( false );
		}
	};

	useEffect( () => {
		console.log( 'effect' );
		onConnect();
	}, [] );

	return (
		<div>
			<p>Authorizing… Please consult your browser window.</p>

			{ verifying ? (
				<p>Verifying…</p>
			) : (
				<p>Not verifying</p>
			) }

			{ error && (
				<p>{ JSON.stringify( error ) }</p>
			) }
		</div>
	);
}