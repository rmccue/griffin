import { WebviewTag } from 'electron';
import React from 'react';

import './HtmlContent.css';
import { getWebviewHeight } from '../../connector';

interface Props {
	html: string;
}

const WEB_PREFERENCES = 'contextIsolation, disableDialogs, javascript=no, webgl=no';

export default class HtmlContent extends React.Component<Props> {
	heightListener: number | null = null;
	ref: WebviewTag | null = null;
	resizer?: any;

	state = {
		height: 200,
	}

	componentWillUnmount() {
		if ( this.heightListener ) {
			window.cancelAnimationFrame( this.heightListener );
		}
	}

	updateRef = ( ref: WebviewTag | null ) => {
		this.ref = ref;
		if ( ! this.ref ) {
			return;
		}

		this.ref.addEventListener( 'dom-ready', async () => {
			if ( ! this.ref ) {
				return;
			}

			const id = this.ref.getWebContentsId();
			const value = await getWebviewHeight( id );
			this.setState( {
				height: value,
			} );
		} );
	}

	render() {
		const { html } = this.props;
		const data = `data:text/html;charset=utf-8;base64,${ btoa( unescape( encodeURIComponent( html ) ) ) }`;
		return (
			<webview
				ref={ this.updateRef }
				src={ data }
				style={ { height: this.state.height } }
				webpreferences={ WEB_PREFERENCES }
			/>
		);
	}
}
