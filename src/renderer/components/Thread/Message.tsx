import React from 'react';

import HtmlContent from './HtmlContent';
import TextContent from './TextContent';
import MessageTime from '../MessageTime';
import { Slot } from '../../slot-fill';
import { Address, Message as MessageType, MessageDetails } from '../../../common/types';

import './Message.css';

interface Props {
	item: MessageType | MessageDetails,
}

type AuthorProps = {
	user: Address,
};

const Author = ( { user }: AuthorProps ) => (
	<span className="Thread-Message__author">
		<span className="Thread-Message__author-name">{ user.name }</span>
		{ ' ' }
		<span className="Thread-Message__author-email">&lt;{ user.address }&gt;</span>
	</span>
);

const Body = ( { item }: { item: MessageDetails } ) => {
	if ( ! item.body.html ) {
		return (
			<TextContent
				content={ item.body.text || '' }
			/>
		);
	}

	return (
		<div>
			<HtmlContent
				html={ item.body.html || '' }
			/>
		</div>
	);
};

export default function Message( props: Props ) {
	const { item } = props;
	return (
		<li className="Thread-Message">
			<header className="Thread-Message__header">
				<div>
					{ item.from.map( user => (
						<Author
							key={ user.address }
							user={ user }
						/>
					) ) }
					<Slot
						fillProps={ { item } }
						name="Thread-Message.header.primary"
					/>
				</div>
				<div>
					{ item.date && (
						<MessageTime
							className="Thread-Message__date"
							relative
							value={ item.date }
						/>
					) }
					<Slot
						fillProps={ { item } }
						name="Thread-Message.header.secondary"
					/>
				</div>
			</header>

			<Slot
				fillProps={ { item } }
				name="Thread-Message.content.start"
			/>
			{ ( item as MessageDetails ).body ? (
				<Body
					item={ item as MessageDetails }
				/>
			) : (
				<p>Loading…</p>
			) }
			<Slot
				fillProps={ { item } }
				name="Thread-Message.content.end"
			/>
		</li>
	);
}
