import { isFunction } from 'lodash';
import React from 'react';
import {
	Provider as BaseProvider,
	Fill as BaseFill,
	Slot as BaseSlot,
} from 'react-slot-fill';

export const Provider = BaseProvider;

interface FillProps {
	name: string;
	children: Function | React.ReactNode;
}

interface FillWrapProps {
	fillProps: FillProps;
	[ k: string ]: any;
}

function FillWrap( props: FillWrapProps ) {
	const { fillProps, ...rest } = props;

	let renderChildren = fillProps.children;
	if ( isFunction( renderChildren ) ) {
		renderChildren = ( fillProps.children as Function )( rest );
	}

	return (
		<>
			{ renderChildren }
		</>
	);
}

export function Fill( props: FillProps ) {
	return (
		<BaseFill name={ props.name }>
			<FillWrap
				fillProps={ props }
			/>
		</BaseFill>
	);
}

interface SlotProps {
	name: string;
	fillProps: {
		[ k: string ]: any;
	};
}

export function Slot( props: SlotProps ) {
	return (
		<BaseSlot
			name={ props.name }
			fillChildProps={ props.fillProps }
		/>
	);
}
