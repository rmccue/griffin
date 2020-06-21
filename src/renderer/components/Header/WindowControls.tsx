import React from 'react';

import Icon from '../Icon';
import {
	minimizeWindow,
	maximizeWindow,
	restoreWindow,
	closeWindow,
} from '../../connector';
import { id as platformId, ICONS } from '../../platform';

import './WindowControls.css';

export default function WindowControls() {
	if ( platformId === 'mac' ) {
		return null;
	}

	return (
		<div className="Header-WindowControls">
			<button
				className="Header-WindowControls__control Header-WindowControls__min"
				onClick={ minimizeWindow }
			>
				<Icon>{ ICONS['window.minimize'] }</Icon>
			</button>
			<button
				className="Header-WindowControls__control Header-WindowControls__max"
				onClick={ restoreWindow }
			>
				<Icon>{ ICONS['window.restore'] }</Icon>
			</button>
			<button
				className="Header-WindowControls__control Header-WindowControls__close"
				onClick={ closeWindow }
			>
				<Icon>{ ICONS['window.close'] }</Icon>
			</button>
		</div>
	);
}
