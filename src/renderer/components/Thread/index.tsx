import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { useHistory } from 'react-router';
import { useLastLocation } from 'react-router-last-location';

import Message from './Message';
import Toolbar, { Button as ToolbarButton } from '../Header/Toolbar';
import { archiveMessages, queryThreadDetails, setRead } from '../../connector';
import { ICONS } from '../../platform';
import { RootState } from '../../reducers';
import { getDetailedMessages, getThreadMessages } from '../../selectors/threads';
import { Fill, Slot } from '../../slot-fill';

import './index.css';

interface Props {
	id: string;
}

type AllProps = Props & ReturnType<typeof mapStateToProps>;

export function Thread( props: AllProps ) {
	const history = useHistory();
	const lastLocation = useLastLocation();

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
		if ( lastLocation ) {
			history.push( lastLocation );
		} else {
			history.push( '/' );
		}
	};

	const fillProps = {
		id: props.id,
	};
	return (
		<article className="Thread">
			<h1>{ subject }</h1>

			<Fill name="Header.toolbar">
				<Toolbar className="Thread__toolbar">
					<ToolbarButton
						icon={ ICONS['messages.archive'] }
						title="Archive message"
						onClick={ onArchive }
					/>
					<Slot
						fillProps={ fillProps }
						name="Thread.toolbar"
					/>
					{/*
					<ToolbarButton
						icon={ ICONS['messages.trash'] }
						title="Delete message"
						onClick={ () => console.log( 'trash' ) }
					/>
					<ToolbarButton
						icon={ ICONS['messages.spam'] }
						title="Mark as spam"
						onClick={ () => console.log( 'spam' ) }
					/>
					*/}
				</Toolbar>
			</Fill>

			<ol className="Thread__content">
				<Slot
					fillProps={ fillProps }
					name="Thread.content.start"
				/>
				{ usefulMessages.map( item => (
					<Message
						key={ item.id }
						item={ item }
					/>
				) ) }
				<Slot
					fillProps={ fillProps }
					name="Thread.content.end"
				/>
			</ol>
		</article>
	);
}

const mapStateToProps = ( state: RootState, props: Props ) => ( {
	details: getDetailedMessages( state, props ),
	messages: getThreadMessages( state, props ),
} );

export default connect( mapStateToProps )( Thread );
