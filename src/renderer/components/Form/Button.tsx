import classNames from 'classnames';
import React from 'react';

import './Button.css';

interface CommonProps {
	children: React.ReactNode;
	className?: string;
	type?: 'primary' | 'default';
}

interface ButtonProps {
	submit: false | undefined;
	onClick( e: React.MouseEvent<HTMLButtonElement> ): void;
}

interface SubmitProps {
	submit: true;
}

type Props = CommonProps & ( ButtonProps | SubmitProps );

export default function Button( props: Props ) {
	const className = classNames( [
		'Form-Button',
		props.type === 'primary' && 'Form-Button__type-primary',
		props.className,
	] );

	return (
		<button
			className={ className }
			type={ props.submit ? 'submit' : 'button' }
			onClick={ props.submit ? undefined : props.onClick }
		>
			{ props.children }
		</button>
	)
}