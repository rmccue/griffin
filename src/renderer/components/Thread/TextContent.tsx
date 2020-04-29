import linkifyUrls from 'linkify-urls';
import React, { useEffect, useRef } from 'react';

interface Props {
	content: string;
}

export default function TextContent( props: Props ) {
	const ref = useRef<HTMLDivElement>( null );

	useEffect( () => {
		const fragment = linkifyUrls( props.content, {
			type: 'dom',
		} );

		// Empty the div.
		while ( ref.current?.firstChild ) {
			ref.current.firstChild.remove();
		}

		// Add our fragment.
		ref.current?.appendChild( fragment );
	}, [ props.content ] );

	return (
		<div
			className="Thread-Message__body-text"
			ref={ ref }
		/>
	);
}
