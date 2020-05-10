import React from 'react';

import './Toggle.css';

interface Props {
	checked: boolean;
}

export default function Toggle( props: Props ) {
	return (
		<input
			// checked={ props.checked }
			className="Form-Toggle"
			type="checkbox"
		/>
	);
}
