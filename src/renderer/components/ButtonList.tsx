import classNames from 'classnames';
import React from 'react';

import Icon from './Icon';

import './ButtonList.css';

interface ButtonProps {
	icon: string;
	selected?: boolean;
	title: string;
	onSelect(): void;
}

export const Button = ( { icon, selected, title, onSelect }: ButtonProps ) => (
	<li>
		{/* Buttons in Chrome cannot be set to display: grid */}
		<span
			className={ classNames( [ 'ButtonList__button', selected && 'Preferences__section-link--selected' ] ) }
			role="button"
			tabIndex={ -1 }
			onClick={ onSelect }
		>
			<Icon>{ icon }</Icon>
			<span>{ title }</span>
		</span>
	</li>
);

export default function ButtonList( { children } ) {
	return (
		<ul>
			{ children }
		</ul>
	);
}
