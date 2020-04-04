import fromPairs from 'lodash/fromPairs';
import { createSelector } from 'reselect';

import { RootState } from '../reducers';
import { lastUpdate } from '../../common/message';
import { Message, Thread } from '../../common/types';

type ThreadMessageProps = {
	id: string;
}

export const getThreadMessages = createSelector(
	( state: RootState ) => state.messages.items,
	( _: RootState, props: ThreadMessageProps ) => props.id,
	( messages: Message[], id: string ) => {
		// console.log( 'recomputing messages', id );
		return messages.filter( message => message.thread === id );
	},
);

export const getDetailedMessages = createSelector(
	( state: RootState ) => state.messages.details,
	( _: RootState, props: ThreadMessageProps ) => props.id,
	( messages: Message[], id: string ) => {
		// console.log( 'recomputing messages' );
		return messages.filter( message => message.thread === id );
	},
);

// export const getThread

export const getThreadUpdateTimes = createSelector(
	( state: RootState ) => state.messages.items,
	( _: RootState, props: { items: Thread[] } ) => props.items,
	( messages: Message[], items: Thread[] ) => {
		// console.log( 'recomputing update times' );
		return fromPairs( items.map( item => (
			[
				item.id,
				lastUpdate( messages.filter( message => message.thread === item.id ) ),
			]
		) ) );
	},
);
