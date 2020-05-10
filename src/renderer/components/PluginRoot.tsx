import React from 'react';

import { getAvailable, Plugin } from '../plugin';

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
				{ Object.keys( plugins ).map( id => {
					const Component = plugins[ id ];
					return (
						<Component
							key={ id }
						/>
					);
				} ) }
			</React.Fragment>
		);
	}
}
