import sfsymbols from '@rmccue/sfsymbols';
import classNames from 'classnames';
import React, { useState } from 'react';

import General from './General';
import Plugins from './Plugins';
import ButtonList, { Button as ListButton } from '../ButtonList';
import Icon from '../Icon';
import HeaderToolbar, { Button as HeaderToolbarButton } from '../Header/Toolbar';

import './index.css';

interface Props {
	visible: boolean;
	onClose(): void;
}

interface SectionLinkProps {
	icon: string;
	selected: boolean;
	title: string;
	onSelect(): void;
}

const Placeholder = () => <main><p>Hello.</p></main>;

const SectionLink = ( { icon, selected, title, onSelect }: SectionLinkProps ) => (
	<li>
		{/* Buttons in Chrome cannot be set to display: grid */}
		<span
			className={ classNames( [ 'Preferences__section-link', selected && 'Preferences__section-link--selected' ] ) }
			role="button"
			tabIndex={ -1 }
			onClick={ onSelect }
		>
			<Icon>{ icon }</Icon>
			<span>{ title }</span>
		</span>
	</li>
);

const SECTIONS = [
	{
		id: 'general',
		icon: sfsymbols['gear'],
		title: 'General',
		component: General,
	},
	{
		id: 'accounts',
		icon: sfsymbols['person.crop.circle'],
		title: 'Accounts',
		component: Placeholder,
	},
	{
		id: 'appearance',
		icon: sfsymbols['paintbrush'],
		title: 'Appearance',
		component: Placeholder,
	},
	{
		id: 'plugins',
		icon: sfsymbols['hammer'],
		title: 'Plugins',
		component: Plugins,
	},
];

export default function Preferences( props: Props ) {
	const [ selected, setSelected ] = useState( SECTIONS[0].id );

	const selectedSection = SECTIONS.find( s => s.id === selected );
	const SectionComponent = selectedSection?.component;
	const className = classNames( [
		'Preferences',
		props.visible && 'Preferences--visible',
	] );
	return (
		<article className={ className }>
			<div className="Preferences__header">
				<HeaderToolbar>
					<HeaderToolbarButton
						icon={ sfsymbols['xmark.circle.fill'] }
						title="Close preferences"
						onClick={ props.onClose }
					/>
				</HeaderToolbar>
			</div>
			<aside className="Preferences__sections">
				<ButtonList>
					{ SECTIONS.map( section => (
						<ListButton
							key={ section.id }
							icon={ section.icon }
							selected={ selected === section.id }
							title={ section.title }
							onSelect={ () => setSelected( section.id ) }
						/>
					) ) }
				</ButtonList>
			</aside>

			{ SectionComponent && (
				<SectionComponent
				/>
			) }
		</article>
	);
}
