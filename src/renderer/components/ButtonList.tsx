import sfsymbols from '@rmccue/sfsymbols';
import classNames from 'classnames';
import React from 'react';

import Icon from './Icon';

import './ButtonList.css';

interface ButtonProps {
	icon: string;
	selected?: boolean;
	title: string;
	withArrow?: boolean;
	onSelect(): void;
}

export const Button = ( { icon, selected, title, withArrow, onSelect }: ButtonProps ) => (
	<li>
		{/* Buttons in Chrome cannot be set to display: grid */}
		<span
			className={ classNames( [
				'ButtonList__button',
				selected && 'Preferences__section-link--selected',
				withArrow && 'ButtonList__button--with-arrow',
			] ) }
			role="button"
			tabIndex={ -1 }
			onClick={ onSelect }
		>
			<Icon>{ icon }</Icon>
			<span>{ title }</span>
			{ withArrow && (
				<Icon>{ sfsymbols['arrow.right.circle'] }</Icon>
			) }
		</span>
	</li>
);

export default function ButtonList( { children } ) {
	return (
		<ul className="ButtonList">
			{ children }
		</ul>
	);
}
