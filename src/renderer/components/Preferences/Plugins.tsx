import sfsymbols from '@rmccue/sfsymbols';
import React, { useEffect, useState } from 'react';

import Button from '../Form/Button';
import Toggle from '../Form/Toggle';
import Icon from '../Icon';
import { getAvailable, pluginRootDir, Plugin as PluginData, PluginMap } from '../../plugin';

import './Plugins.css';

type PluginProps = {
	data: PluginData;
	enabled: boolean;
}

function Plugin( props: PluginProps ) {
	const { data, enabled } = props;
	return (
		<li
			className="Preferences-Plugins__plugin"
		>
			<header className="Preferences-Plugins__plugin-header">
				<div className="Preferences-Plugins__plugins-name">
					<h2>{ data.data.displayName || data.id }</h2>
					{ data.type === 'bundled' ? (
						<abbr title="Included with Griffin">
							<Icon>{ sfsymbols['cube.box'] }</Icon>
						</abbr>
					) : data.data.displayName && (
						<code className="Preferences-Plugins__plugin-id">{ data.id }</code>
					) }
				</div>

				<div style={{ alignItems: 'baseline' }}>
					{/* { enabled ? 'Enabled' : 'Disabled' } */}
					<Toggle
						checked={ enabled }
					/>
				</div>
			</header>

			<p>{ data.data.description || '' }</p>
		</li>
	)
}

const enabled = [
	'foo',
];

export default function Plugins() {
	const [ available, setAvailable ] = useState<PluginMap | null>( null );

	const onLoadAvailable = () => getAvailable().then( available => setAvailable( available ) );
	useEffect( () => {
		onLoadAvailable();
	}, [ enabled ] );

	return (
		<main className="Preferences-Plugins">
			<header className="Preferences-Plugins__header">
				<h1>Plugins</h1>
				<Button
					className="Preferences-Plugins__reload"
					onClick={ () => onLoadAvailable() }
				>
					<Icon>{ sfsymbols['arrow.clockwise.circle'] }</Icon>
				</Button>
			</header>

			{ available ? (
				<ul className="Preferences-Plugins__list">
					{ Object.keys( available ).map( id => (
						<Plugin
							key={ id }
							data={ available[ id ] }
							enabled={ enabled.indexOf( id ) >= 0 }
						/>
					) ) }
				</ul>
			) : (
				<p>Loading…</p>
			) }

			<p>Plugin directory: <code>{ pluginRootDir }</code></p>
		</main>
	)
}