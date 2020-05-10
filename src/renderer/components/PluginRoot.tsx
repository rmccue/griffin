import React from 'react';

interface Plugin {
	id: string;
	name: string;
	component: React.FC;
}

const enabledPlugins = [
];

interface State {
	plugins: Plugin[];
}

let didMount = false;

export default class PluginRoot extends React.Component {
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
		const plugins = await Promise.all( enabledPlugins.map( async plugin => {
			const mod = await import( `../plugins/${ plugin }` );
			return mod.default;
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
