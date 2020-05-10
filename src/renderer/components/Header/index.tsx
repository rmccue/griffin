import sfsymbols from '@rmccue/sfsymbols';
import classNames from 'classnames';
import React from 'react';
import { useHistory } from 'react-router';

import Toolbar, { Button, Separator } from './Toolbar';
import { useHistoryState } from '../Router';
import { reload, save } from '../../connector';
import { Slot } from '../../slot-fill';

import './index.css';

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
					icon={ sfsymbols['sidebar.left'] }
					title="Open sidebar"
					onClick={ props.onToggleSidebar }
				/>
				<Separator />
				<Button
					disabled={ ! historyState.canGoBack }
					icon={ sfsymbols['chevron.left'] }
					title="Back one page"
					onClick={ () => history.go( -1 ) }
				/>
				<Button
					disabled={ ! historyState.canGoForward }
					icon={ sfsymbols['chevron.right'] }
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
					icon={ sfsymbols['arrow.counterclockwise.circle'] }
					title="Reload"
					onClick={ () => reload() }
				/>
				<Button
					icon={ sfsymbols['arrow.down.circle'] }
					title="Save"
					onClick={ () => save() }
				/>
				<Button
					icon={ sfsymbols['gear'] }
					title="Open preferences"
					onClick={ props.onShowPreferences }
				/>
			</Toolbar>
		</header>
	);
}
