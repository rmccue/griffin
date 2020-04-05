import classNames from 'classnames';
import React from 'react';

import './Row.css';

interface Props {
	children: React.ReactNode;
	className?: string;
}

export default function Row( props: Props ) {
	const className = classNames( [
		'Form-Row',
		props.className
	] );
	return (
		<div className={ className }>
			{ props.children }
		</div>
	);
}
