import React from 'react';

import Icon from '../Icon';
import { id as platformId, ICONS } from '../../platform';

import './WindowControls.css';

export default function WindowControls() {
	if ( platformId === 'mac' ) {
		return null;
	}

	return (
		<div className="Header-WindowControls">
			<button className="Header-WindowControls__control Header-WindowControls__min">
				<Icon>{ ICONS['window.minimize'] }</Icon>
			</button>
			<button className="Header-WindowControls__control Header-WindowControls__max">
				<Icon>{ ICONS['window.restore'] }</Icon>
			</button>
			<button className="Header-WindowControls__control Header-WindowControls__close">
				<Icon>{ ICONS['window.close'] }</Icon>
			</button>
		</div>
	);
}
