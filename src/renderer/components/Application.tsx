import classNames from 'classnames';
import { hot } from 'react-hot-loader/root';
import React, { useState } from 'react';
import { Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';

import Header from './Header';
import Logo from './Logo';
import Mailbox from './Mailbox';
import Preferences from './Preferences';
import Router from './Router';
import Sidebar from './Sidebar';
import Thread from './Thread';
import Welcome from './Welcome';
import { RootState } from '../reducers';

import './Application.css';

interface Props {
	accounts: RootState['accounts']['accounts'];
	loading: boolean;
}

const Application = ( props: Props ) => {
	const [ showSidebar, setSidebar ] = useState( false );
	const [ showPrefs, setPrefs ] = useState( false );

	if ( ! props.loading && Object.keys( props.accounts ).length < 1 ) {
		return (
			<Welcome

			/>
		);
	}

	const loaderClasses = classNames( [
		'Application__loader',
		props.loading && 'Application__loader--loading',
	] );

	return (
		<Router>
			<div className={ loaderClasses }>
				<Logo />
			</div>

			<Preferences
				visible={ showPrefs }
				onClose={ () => setPrefs( false ) }
			/>
			<div className="Application">
				<Header
					sidebarVisible={ showSidebar }
					onShowPreferences={ () => setPrefs( true ) }
					onToggleSidebar={ () => setSidebar( ! showSidebar ) }
				/>

				<Sidebar
					visible={ showSidebar }
				/>

				<main>
					<Switch>
						<Route
							path="/thread/:id"
						>
							{ ( { match } ) => (
								<Thread
									id={ match?.params.id }
								/>
							) }
						</Route>
						<Route
							exact
							path="/"
						>
							<Mailbox />
						</Route>
						<Route>
							404, weirdly.
						</Route>
					</Switch>
				</main>
				{/* <footer>
					Footer?
				</footer> */}
			</div>
		</Router>
	);
}

const mapStateToProps = ( state: RootState ) => {
	return {
		accounts: state.accounts.accounts,
		loading: state.accounts.loading,
	};
}

export default hot( connect( mapStateToProps )( Application ) );
