import React from 'react';

import './Toggle.css';

interface Props {
	checked: boolean;
	onChange( e: React.ChangeEvent<HTMLInputElement> ): void;
}

export default function Toggle( props: Props ) {
	return (
		<input
			checked={ props.checked }
			className="Form-Toggle"
			type="checkbox"
			onChange={ props.onChange }
		/>
	);
}
