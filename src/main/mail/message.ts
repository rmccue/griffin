import { FetchMessageObject } from 'imapflow';

import { findContentParts } from './content';
import { Message, MessageFlags } from '../../common/types';

export function parseFlags( flags: Set<string> | undefined ): MessageFlags {
	return {
		answered: flags?.has( '\\Answered' ) || false,
		deleted: flags?.has( '\\Deleted' ) || false,
		draft: flags?.has( '\\Draft' ) || false,
		flagged: flags?.has( '\\Flagged' ) || false,
		seen: flags?.has( '\\Seen' ) || false,
	};
}

export function messageFromImap( raw: FetchMessageObject, summary?: string ) : Message | null {
	if ( ! raw.envelope ) {
		return null;
	}

	const contentParts = raw.bodyStructure && findContentParts( raw.bodyStructure );
	const message: Message = {
		id: raw.emailId || raw.envelope.messageId || '',
		uid: raw.uid,
		thread: raw.threadId,
		messageId: raw.envelope.messageId,
		subject: raw.envelope.subject,
		date: raw.envelope.date,
		from: raw.envelope.from || [],
		to: raw.envelope.to || [],
		sender: raw.envelope.sender || [],
		replyTo: raw.envelope.replyTo || [],
		flags: parseFlags( raw.flags ),
		contentParts: contentParts || [],
		summary: summary,
	};

	return message;
}
