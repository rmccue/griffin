import React, { useState } from 'react';

import Button from '../Form/Button';
import ButtonRow from '../Form/ButtonRow';
import FormRow from '../Form/Row';
import TextInput from '../Form/TextInput';
import { verifyAccount } from '../../connector';
import { ConnectionOptions } from '../../../common/types';

interface Props {
	onCancel?: () => void;
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
				service: 'imap',
				host: 'imap.gmail.com',
				port: 993,
				secure: true,
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
			<h1>Enter account details</h1>
			<p>We'll need your account details too.</p>

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

			{ verifying ? (
				<p>Verifying…</p>
			) : (
				<ButtonRow>
					{ props.onCancel && (
						<Button
							submit={ false }
							onClick={ props.onCancel }
						>
							Cancel
						</Button>
					) }

					<Button
						submit
						type="primary"
					>
						Sign In
					</Button>
				</ButtonRow>
			) }

			{ error && (
				<p>{ error }</p>
			) }
		</form>
	);
}