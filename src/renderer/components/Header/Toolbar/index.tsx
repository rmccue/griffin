import classNames from 'classnames';
import React from 'react';

export { default as Button } from './Button';
export { default as Separator } from './Separator';

interface Props {
	children?: React.ReactNode;
	className?: string;
}

export default function Toolbar( props: Props ) {
	const className = classNames( [
		'Header-Toolbar',
		props.className,
	] );
	return (
		<div
			children={ props.children }
			className={ className }
		/>
	);
}
