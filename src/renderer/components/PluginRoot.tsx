import React from 'react';

import { PluginErrorBoundary } from './PluginError';
import { getAvailable, Plugin } from '../plugin';

type RenderProps = {
	component: React.ComponentType;
}
const PluginRender = ( props: RenderProps ) => ( <props.component /> );

interface Props {
	enabled: string[];
}

interface State {
	plugins: {
		[ k: string ]: React.ComponentType,
	};
}

let didMount = false;

export default class PluginRoot extends React.Component<Props> {
	state: State = {
		plugins: {},
	};

	componentWillMount() {
		this.loadPlugins();
	}

	componentDidUpdate() {
		// Detect HMR.
		if ( ! didMount ) {
			this.loadPlugins();
			didMount = true;
		}
	}

	async loadPlugins() {
		const available = await getAvailable();

		const plugins = {};
		for await ( const id of this.props.enabled ) {
			if ( ! available[ id ] ) {
				console.warn( `Cannot find ${ id }` );
				return null;
			}

			plugins[ id ] = await available[ id ].load();
		}

		this.setState( { plugins } );
	}

	render() {
		const { plugins } = this.state;

		return (
			<React.Fragment>
				{ Object.keys( plugins ).map( id => (
					<PluginErrorBoundary id={ id }>
						<PluginRender
							key={ id }
							component={ plugins[ id ] }
						/>
					</PluginErrorBoundary>
				) ) }
			</React.Fragment>
		);
	}
}
