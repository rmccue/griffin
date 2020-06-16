import sfsymbols from '@rmccue/sfsymbols';
import classNames from 'classnames';
import React from 'react';
import { useHistory } from 'react-router';

import Toolbar, { Button, Separator } from './Toolbar';
import { useHistoryState } from '../Router';
import { reload, save } from '../../connector';
import { Slot } from '../../slot-fill';

import './index.css';

const isWin = true;
const ICONS = {
	'sidebar.left': isWin ? '\uE700' : sfsymbols['sidebar.left'],
	'chevron.left': isWin ? '\uE76B' : sfsymbols['chevron.left'],
	'chevron.right': isWin ? '\uE76C' :  sfsymbols['chevron.right'],
	'arrow.counterclockwise.circle': isWin ? '\uE777' : sfsymbols['arrow.counterclockwise.circle'],
	'arrow.down.cirlce': isWin ? '\uF0AE' : sfsymbols['arrow.down.cirlce'],
	'gear': isWin ? '\uE713' : sfsymbols['gear'],
}

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
					icon={ ICONS['sidebar.left'] }
					title="Open sidebar"
					onClick={ props.onToggleSidebar }
				/>
				<Separator />
				<Button
					disabled={ ! historyState.canGoBack }
					icon={ ICONS['chevron.left'] }
					title="Back one page"
					onClick={ () => history.go( -1 ) }
				/>
				<Button
					disabled={ ! historyState.canGoForward }
					icon={ ICONS['chevron.right'] }
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
					icon={ ICONS['arrow.counterclockwise.circle'] }
					title="Reload"
					onClick={ () => reload() }
				/>
				<Button
					icon={ ICONS['arrow.down.circle'] }
					title="Save"
					onClick={ () => save() }
				/>
				<Button
					icon={ ICONS['gear'] }
					title="Open preferences"
					onClick={ props.onShowPreferences }
				/>
			</Toolbar>
		</header>
	);
}
