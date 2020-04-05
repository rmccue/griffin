import React from 'react';

import './ButtonRow.css';

type Props = {
	children: React.ReactNode,
};

export default function ButtonRow( props: Props ) {
	return (
		<div className="Form-ButtonRow">
			{ props.children }
		</div>
	);
}
