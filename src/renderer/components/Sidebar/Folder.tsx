import sfsymbols from '@rmccue/sfsymbols';
import classNames from 'classnames';
import React, { useState } from 'react';

import Icon from '../Icon';

import './Folder.css';

export interface Props {
	children?: React.ReactNode;
	icon?: string;
	name: string;
	path: string;
	selected?: boolean;
	subfolders?: Props[];
}

export default function Folder( props: Props ) {
	const [ expanded, setExpanded ] = useState( false );

	const hasChildren = props.subfolders && props.subfolders.length > 0;
	const className = classNames( [
		'Sidebar-Folder',
		hasChildren && 'Sidebar-Folder--has-children',
		props.selected && 'Sidebar-Folder--selected',
		expanded && 'Sidebar-Folder--expanded',
	] );

	return (
		<li className={ className }>
			<div className="Sidebar-Folder__main">
				{ hasChildren && (
					<button
						className="Sidebar-Folder__disclosure"
						type="button"
						onClick={ () => setExpanded( ! expanded ) }
					>
						<Icon>{ sfsymbols['arrowtriangle.right.fill'] }</Icon>
					</button>
				) }

				<a href="#">
					<Icon>{ props.icon || sfsymbols['folder'] }</Icon>
					<span className="Sidebar-Folder__name">{ props.name }</span>
				</a>
			</div>

			{ hasChildren && (
				<ol className="Sidebar-Folder__children">
					{ props.subfolders!.map( folder => (
						<Folder
							key={ folder.path }
							{ ...folder }
						/>
					) ) }
				</ol>
			) }
			{ props.children }
		</li>
	);
};
