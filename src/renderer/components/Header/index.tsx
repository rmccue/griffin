import classNames from 'classnames';
import React from 'react';
import { useHistory } from 'react-router';

import Toolbar, { Button, Separator } from './Toolbar';
import { useHistoryState } from '../Router';
import { reload, save } from '../../connector';
import { ICONS } from '../../platform';
import { Slot } from '../../slot-fill';

import './index.css';

const isWin = true;

interface Props {
	sidebarVisible: boolean;
	onShowPreferences(): void;
	onToggleSidebar(): void;
}

export default function Header( props: Props ) {
	const history = useHistory();
	const historyState = useHistoryState();

	return (
		<header className="Header">
			<Toolbar className="Header__meta-tools">
				<Button
					icon={ ICONS['header.toggle-sidebar'] }
					title="Open sidebar"
					onClick={ props.onToggleSidebar }
				/>
				<Separator />
				<Button
					disabled={ ! historyState.canGoBack }
					icon={ ICONS['header.nav-back'] }
					title="Back one page"
					onClick={ () => history.go( -1 ) }
				/>
				<Button
					disabled={ ! historyState.canGoForward }
					icon={ ICONS['header.nav-forward'] }
					title="Forward one page"
					onClick={ () => history.go( 1 ) }
				/>
			</Toolbar>
			<div className={ classNames( 'Header__centered', props.sidebarVisible && 'Header__centered--sidebar' ) }>
				<Slot
					name="Header.toolbar"
				/>
			</div>
			<Toolbar className="Header__user-tools">
				<Button
					icon={ ICONS['header.reload'] }
					title="Reload"
					onClick={ () => reload() }
				/>
				<Button
					icon={ ICONS['header.save'] }
					title="Save"
					onClick={ () => save() }
				/>
				<Button
					icon={ ICONS['header.preferences'] }
					title="Open preferences"
					onClick={ props.onShowPreferences }
				/>
			</Toolbar>
		</header>
	);
}
