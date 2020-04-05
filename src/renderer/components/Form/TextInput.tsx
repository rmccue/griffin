import classNames from 'classnames';
import React from 'react';

import './TextInput.css';

type Props = React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;

export default function TextInput( props: Props ) {
	const className = classNames( [
		'Form-TextInput',
		props.className,
	] );

	return (
		<input
			className={ className }
			type={ props.type }
			value={ props.value }
			onChange={ props.onChange }
		/>
	);
}
