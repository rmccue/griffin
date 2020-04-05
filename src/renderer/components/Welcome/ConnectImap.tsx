import React, { useState } from 'react';

import FormRow from '../Form/Row';
import TextInput from '../Form/TextInput';
import { verifyAccount } from '../../connector';
import { ConnectionOptions } from '../../../common/types';

interface Props {
	onCreate( options: ConnectionOptions ): void;
}

export default function ConnectImap( props: Props ) {
	const [ address, setAddress ] = useState( '' );
	const [ password, setPassword ] = useState( '' );
	const [ verifying, setVerifying ] = useState( false );
	const [ error, setError ] = useState<string | null>( null );

	const type = 'gmail';

	const onSubmit = async ( e: React.FormEvent ) => {
		e.preventDefault();
		setError( null );
		setVerifying( true );

		let connection: ConnectionOptions;
		if ( type === 'gmail' ) {
			connection = {
				service: 'gmail',
				auth: {
					user: address,
					pass: password,
				}
			}
		} else {
			connection = {
				service: 'imap',
				host: 'imap.gmail.com',
				port: 993,
				secure: true,
				auth: {
					user: address,
					pass: password,
				},
			};
		}

		const res = await verifyAccount( connection );
		setVerifying( false );
		if ( res.error !== false ) {
			setError( res.error.type );
			return;
		}

		props.onCreate( connection );
	};

	return (
		<form
			onSubmit={ onSubmit }
		>
			<FormRow>
				<label>Username:</label>
				<TextInput
					type="email"
					value={ address }
					onChange={ e => setAddress( e.target.value ) }
				/>
			</FormRow>

			<FormRow>
				<label>Password:</label>
				<TextInput
					type="password"
					value={ password }
					onChange={ e => setPassword( e.target.value ) }
				/>
			</FormRow>

			{ error && (
				<p>{ error }</p>
			) }

			{ verifying ? (
				<p>Verifying…</p>
			) : (
				<button type="submit">
					Sign In
				</button>
			) }
		</form>
	);
}