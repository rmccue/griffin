import { hot } from 'react-hot-loader/root';
import React, { useState } from 'react';
import { Route, Switch } from 'react-router-dom';

import Header from './Header';
import Mailbox from './Mailbox';
import Preferences from './Preferences';
import Router from './Router';
import Sidebar from './Sidebar';
import Thread from './Thread';

import './Application.css';

const Application = () => {
	const [ showSidebar, setSidebar ] = useState( false );
	const [ showPrefs, setPrefs ] = useState( false );
	return (
		<Router>
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

export default hot( Application );
