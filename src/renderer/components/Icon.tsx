import React from 'react';

import './Icon.css';

interface Props {
	children: string,
};

export default function Icon( props: Props ) {
	return (
		<i
			className="Icon"
		>
			{ props.children }
		</i>
	);
}
