import React from 'react';

import { getAvailable, Plugin } from '../plugin';

interface Props {
	enabled: string[];
}

interface State {
	plugins: Plugin[];
}

let didMount = false;

export default class PluginRoot extends React.Component<Props> {
	state: State = {
		plugins: [],
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

		const plugins = await Promise.all( this.props.enabled.map( async plugin => {
			if ( ! available[ plugin ] ) {
				return null;
			}

			return await available[ plugin ].load();
		} ) );

		this.setState( { plugins } );
	}

	render() {
		const { plugins } = this.state;

		return (
			<React.Fragment>
				{ plugins.map( plugin => (
					<plugin.component
						key={ plugin.id }
					/>
				) ) }
			</React.Fragment>
		);
	}
}
