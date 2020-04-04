import React from 'react';

import Icon from '../../Icon';

import './Button.css';

interface Props {
	disabled?: boolean;
	icon: string;
	title: string;
	onClick( e: React.MouseEvent<HTMLButtonElement> ): void,
}

export default function Button( props: Props ) {
	return (
		<button
			className="Header-Toolbar-Button"
			disabled={ props.disabled }
			type="button"
			title={ props.title }
			onClick={ props.onClick }
		>
			<Icon>{ props.icon }</Icon>
		</button>
	);
}
