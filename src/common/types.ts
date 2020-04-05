type ThreadId = string;
type MessageId = string;
type Uid = number;

export interface Thread {
	id: ThreadId;
	messages: Uid[];
	date?: Date;
}

export interface Address {
	name?: string;
	address?: string;
}

export interface MessageFlags {
	answered: boolean;
	flagged: boolean;
	deleted: boolean;
	seen: boolean;
	draft: boolean;
}

export interface ContentPart {
	charset: string,
	encoding: string,
	part: string;
	type: 'text/plain' | 'text/html';
}

export interface Message {
	id: MessageId;
	uid: Uid;
	thread?: ThreadId;
	messageId?: string;
	subject?: string;
	date?: Date;
	from: Address[];
	to: Address[];
	sender: Address[];
	replyTo: Address[];
	flags: MessageFlags;
	contentParts: ContentPart[];
	summary?: string;
}

export type PartialMessage = Partial<Message> & Pick<Message, 'id'>;

export interface MessageDetails extends Message {
	body: {
		html: string | null,
		text: string | null,
		autotext: string | null,
	};
}

export interface ThreadResponse {
	threads: Thread[];
	messages?: Message[];
	nextCursor: number | null;
}

interface ImapOptions {
	service: 'imap';
	auth: {
		user: string;
		pass: string;
	}
	host: string;
	port: number;
	secure: boolean;
}

interface GmailOptions {
	service: 'gmail';
	auth: {
		user: string;
		pass: string;
		// token: string;
	}
}

interface OtherConnectionOptions {
}

export type ConnectionOptions = ( ImapOptions | GmailOptions ) & OtherConnectionOptions;

export interface AccountOptions {
	connection: ConnectionOptions;
}

export interface AccountConnectionStatus {
	error: false | {
		type: 'authentication_failed' | 'unknown'
	};
}
