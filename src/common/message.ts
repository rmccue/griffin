import { Message, Thread } from './types';

export function lastUpdate( messages: Message[] ) {
	return messages.reduce<Date | null>( ( date, message ) => {
		if ( ! date ) {
			return message.date || null;
		}

		return ( message.date && message.date > date ) ? message.date : date;
	}, null );
}
