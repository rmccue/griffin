import sfsymbols from '@rmccue/sfsymbols';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Button from '../Form/Button';
import Toggle from '../Form/Toggle';
import Icon from '../Icon';
import { getAvailable, pluginRootDir, Plugin as PluginData, PluginMap } from '../../plugin';
import { RootState } from '../../reducers';
import { PreferencesAction } from '../../../common/actions/preferences';

import './Plugins.css';

type PluginProps = {
	data: PluginData;
	enabled: boolean;
	onActivate(): void;
	onDeactivate(): void;
}

function Plugin( props: PluginProps ) {
	const { data, enabled, onActivate, onDeactivate } = props;
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
						onChange={ () => enabled ? onDeactivate() : onActivate() }
					/>
				</div>
			</header>

			<p>{ data.data.description || '' }</p>
		</li>
	)
}

export default function Plugins() {
	const [ available, setAvailable ] = useState<PluginMap | null>( null );
	const enabled = useSelector( ( state: RootState ) => state.preferences.plugins );
	const dispatch = useDispatch<(action: PreferencesAction) => void>();
	const onActivate = ( id: string ) => dispatch( { type: 'ACTIVATE_PLUGIN', payload: { id } } );
	const onDeactivate = ( id: string ) => dispatch( { type: 'DEACTIVATE_PLUGIN', payload: { id } } );

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
							onActivate={ () => onActivate( id ) }
							onDeactivate={ () => onDeactivate( id ) }
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