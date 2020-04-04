import sfsymbols from '@rmccue/sfsymbols';
import classNames from 'classnames';
import React from 'react'

import Folder, { Props as FolderProps } from './Folder';

import data from './dirs';

import './index.css';

type ListTreeResponse = {
	root?: boolean;
	path: string;
	name: string;
	delimiter?: string;
	flags?: any;
	specialUse?: string;
	listed?: boolean;
	subscribed?: boolean;
	disabled?: boolean;
	folders?: ListTreeResponse[];
};

const searchItems = ( items: ListTreeResponse[], predicate: ( item: ListTreeResponse ) => boolean ) => {
	for ( const item of items ) {
		// console.log( item );
		const success = predicate( item );
		if ( success ) {
			return item;
		}

		if ( item.folders?.length ) {
			const success = searchItems( item.folders, predicate );
			if ( success ) {
				return success;
			}
		}
	}

	return null;
}

const FolderTree = ( { data }: { data: ListTreeResponse } ) => (
	<Folder
		name={ data.name }
		path={ data.path }
	>
		{ data.folders && (
			<ol className="Sidebar__folder-list">
				{ data.folders.map( folder => (
					<FolderTree
						key={ folder.path }
						data={ folder }
					/>
				) ) }
			</ol>
		) }
	</Folder>
);

const treeToProps = ( items: ListTreeResponse[] ): FolderProps[] => {
	return items.map( item => ( {
		name: item.name,
		path: item.path,
		subfolders: item.folders ? treeToProps( item.folders ) : undefined,
	} ) );
};

export default function Sidebar( props ) {
	const className = classNames( [
		'Sidebar',
		props.visible && 'Sidebar--visible',
	] );

	const folders: ListTreeResponse[] = data.folders;

	// Remove unselectable and special
	const regular = folders.filter( folder => {
		if ( folder.specialUse ) {
			return false;
		}

		if ( folder.disabled ) {
			return false;
		}

		return true;
	} );

	// Grab the special folders.
	const inbox = folders.find( folder => folder.specialUse === '\\Inbox' );
	const starred = searchItems( folders, folder => folder.specialUse === '\\Flagged' );
	const drafts = searchItems( folders, folder => folder.specialUse === '\\Drafts' );
	const sent = searchItems( folders, folder => folder.specialUse === '\\Sent' );
	const spam = searchItems( folders, folder => folder.specialUse === '\\Junk' );
	const trash = searchItems( folders, folder => folder.specialUse === '\\Trash' );

	return (
		<aside className={ className }>
			<ol className="Sidebar__folders">
				{ inbox && (
					<Folder
						icon={ sfsymbols['tray.and.arrow.down.fill'] }
						name="Inbox"
						path={ inbox.path }
						selected
					/>
				) }
				{ starred && (
					<Folder
						icon={ sfsymbols['star.fill'] }
						name={ starred.name }
						path={ starred.path }
					/>
				) }
				{ drafts && (
					<Folder
						icon={ sfsymbols['doc.text.fill'] }
						name={ drafts.name }
						path={ drafts.path }
					/>
				) }
				{ sent && (
					<Folder
						icon={ sfsymbols['paperplane.fill'] }
						name={ sent.name }
						path={ sent.path }
					/>
				) }
				{ spam && (
					<Folder
						icon={ sfsymbols['bin.xmark.fill'] }
						name={ spam.name }
						path={ spam.path }
					/>
				)}
				{ trash && (
					<Folder
						icon={ sfsymbols['trash.fill'] }
						name={ trash.name }
						path={ trash.path }
					/>
				) }

				{ treeToProps( regular ).map( folder => (
					<Folder
						key={ folder.path }
						{ ...folder }
					/>
				) ) }
			</ol>
		</aside>
	);
}
