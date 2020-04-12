import { Fill } from '@humanmade/react-slot-fill';
import sfsymbols from '@rmccue/sfsymbols';
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { useHistory } from 'react-router';

import Message from './Message';
import Toolbar, { Button as ToolbarButton } from '../Header/Toolbar';
import { archiveMessages, queryThreadDetails, setRead } from '../../connector';
import { RootState } from '../../reducers';
import { getDetailedMessages, getThreadMessages } from '../../selectors/threads';

import './index.css';

interface Props {
	id: string;
}

type AllProps = Props & ReturnType<typeof mapStateToProps>;

export function Thread( props: AllProps ) {
	const history = useHistory();

	useEffect( () => {
		// Mark messages as read.
		if ( props.messages ) {
			const unread = props.messages.filter( message => ! message.flags.seen );
			if ( unread.length > 0 ) {
				setRead( unread );
			}
		}

		// Fetch details if we need them.
		if ( ! props.details.length ) {
			queryThreadDetails( props.id );
		}
	} );

	const { details, messages } = props;

	if ( ! messages.length ) {
		return null;
	}

	const subject = messages[0].subject;
	const usefulMessages = details.length ? details : messages;

	const onArchive = () => {
		archiveMessages( messages );

		// Close thread and go back to previous page.
		// todo: replace with .push instead
		history.goBack();
	};

	return (
		<article className="Thread">
			<h1>{ subject }</h1>

			<Fill name="Header.toolbar">
				<Toolbar className="Thread__toolbar">
					<ToolbarButton
						icon={ sfsymbols['archivebox.fill'] }
						title="Archive message"
						onClick={ onArchive }
					/>
					<ToolbarButton
						icon={ sfsymbols['trash.fill'] }
						title="Delete message"
						onClick={ () => console.log( 'trash' ) }
					/>
					<ToolbarButton
						icon={ sfsymbols['bin.xmark.fill'] }
						title="Mark as spam"
						onClick={ () => console.log( 'spam' ) }
					/>
				</Toolbar>
			</Fill>

			<ol className="Thread__content">
				{ usefulMessages.map( item => (
					<Message
						key={ item.id }
						item={ item }
					/>
				) ) }
			</ol>
		</article>
	);
}

const mapStateToProps = ( state: RootState, props: Props ) => ( {
	details: getDetailedMessages( state, props ),
	messages: getThreadMessages( state, props ),
} );

export default connect( mapStateToProps )( Thread );
