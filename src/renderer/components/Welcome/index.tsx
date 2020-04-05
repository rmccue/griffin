import React, { useState } from 'react';

import ConnectImap from './ConnectImap';
import ButtonList, { Button } from '../ButtonList';
import { ConnectionOptions, AccountOptions } from '../../../common/types';
import { addAccount } from '../../connector';

import './index.css';

export default function Welcome() {
	const [ type, setType ] = useState<string | null>( null );

	const onAdd = ( connection: ConnectionOptions ) => {
		const options: AccountOptions = {
			connection,
		};
		addAccount( options );
	}

	return (
		<main className="Welcome">
			{ ( ! type ) ? (
				<div className="Welcome__step">
					<h1>Welcome!</h1>
					<p>To start, add your first account ({ type }).</p>

					<ButtonList>
						<Button
							icon={ '' }
							title="Gmail"
							onSelect={ () => setType( 'gmail' ) }
						/>
						<Button
							icon={ '' }
							title="Other IMAP server"
							onSelect={ () => setType( 'imap' ) }
						/>
					</ButtonList>
				</div>
			) : (
				<div className="Welcome__step">
					<h1>Enter account details</h1>
					<p>We'll need your account details too.</p>

					<ConnectImap
						onCreate={ onAdd }
					/>
				</div>
			) }
		</main>
	)
}
