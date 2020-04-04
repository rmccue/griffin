import classnames from 'classnames';
import uniq from 'lodash/uniq';
import React from 'react';
import { connect } from 'react-redux';
import { FormattedRelativeTime } from 'react-intl';

import Checkbox from '../Form/Checkbox';
import MessageTime from '../MessageTime';
import { RootState } from '../../reducers';
import { getThreadMessages } from '../../selectors/threads';
import { lastUpdate } from '../../../common/message';
import { Address, Thread as ThreadType } from '../../../common/types';

import './Thread.css';

interface Props {
	current: boolean,
	item: ThreadType,
	selected: boolean,
	onDeselect(): void,
	onOpen(): void,
	onSelect(): void,
	onSetCurrent(): void,
};

type AllProps = Props & ReturnType<typeof mapStateToProps>;

const userName = ( user: Address ) => {
	if ( user.name ) {
		return user.name;
	}

	if ( user.address ) {
		return user.address.split( '@' )[0];
	}

	return 'A Mysterious Stranger';
}

export function Thread( props: AllProps ) {
	const { item, messages, selected, onDeselect, onOpen, onSelect } = props;

	// console.log( props.item.id );
	if ( ! messages.length ) {
		return null;
	}

	const allParticipants = uniq( messages.map( message => userName( message.from[0] ) ) );
	const updated = lastUpdate( messages );

	const readAll = messages.reduce<boolean>( ( readAll, message ) => {
		return readAll && message.flags.seen;
	}, true );

	const className = classnames(
		'ThreadList-Thread',
		! readAll && 'ThreadList-Thread--unread',
	);

	return (
		<li
			className={ className }
			onClick={ onOpen }
		>
			<Checkbox
				checked={ selected }
				className="ThreadList-Thread__select"
				label="Select"
				onClick={ () => selected ? onSelect() : onDeselect() }
			/>
			<span className="ThreadList-Thread__participants">
				{ allParticipants.join( ', ' ) }
				{ messages.length > 1 && (
					<span className="ThreadList-Thread__message-count">
						{ messages.length }
					</span>
				) }
			</span>
			<span className="ThreadList-Thread__summary">
				<span className="ThreadList-Thread__subject">
					{ messages[0].subject }
				</span>
				{ messages[0].summary && (
					<span className="ThreadList-Thread__preview">
						{ messages[0].summary }
					</span>
				) }
			</span>
			<MessageTime
				className="ThreadList-Thread__datetime"
				short
				value={ updated! }
			/>
		</li>
	);
}

const mapStateToProps = ( state: RootState, props: Props ) => ( {
	messages: getThreadMessages( state, { id: props.item.id } ),
} );

export default connect( mapStateToProps )( Thread );
