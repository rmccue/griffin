import React from 'react';

import Button from './Form/Button';
import Icon from './Icon';
import { Fill } from '../slot-fill';
import { ICONS } from '../platform';

import './PluginError.css';

interface ErrorProps {
	id: string;
	onDismiss(): void;
}

export function PluginError( props: ErrorProps ) {
	return (
		<Fill name="Application.footer">
			<div className="PluginError">
				<Icon>{ ICONS['plugins.error'] }</Icon>
				<p>Unable to load <code>{ props.id }</code>.</p>
				<Button onClick={ props.onDismiss }>Dismiss</Button>
			</div>
		</Fill>
	);
}

interface BoundaryProps {
	id: string;
}

export class PluginErrorBoundary extends React.Component<BoundaryProps> {
	state = {
		hasError: false,
		isDismissed: false,
	};

	static getDerivedStateFromError( error: any ) {
		return {
			hasError: true,
			isDismissed: false,
		};
	}

	componentDidCatch( error: any, errorInfo: any ) {
		console.log( error, errorInfo );
	}

	render() {
		if ( ! this.state.hasError ) {
			return this.props.children;
		}

		if ( this.state.isDismissed ) {
			return null;
		}

		return (
			<PluginError
				{ ...this.props }
				onDismiss={ () => this.setState( { isDismissed: true } ) }
			/>
		);
	}
}
