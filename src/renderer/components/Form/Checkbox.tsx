import classnames from 'classnames';
import React from 'react';

import './Checkbox.css';

interface Props {
	checked: boolean;
	className?: string;
	label: string;
	onClick( event: React.MouseEvent< HTMLInputElement, MouseEvent > ): void,
}

export default function Checkbox( props: Props ) {
	const className = classnames( [
		'Checkbox',
		props.className,
	] );

	return (
		<label className={ className }>
			<input
				checked={ props.checked }
				className="Checkbox__input"
				type="checkbox"
				onClick={ props.onClick }
			/>
			<span className="Checkbox__text">{ props.label }</span>
		</label>
	);
}
