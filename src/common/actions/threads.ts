import { Message, Thread } from '../types';

export const QUERY_THREADS_REQUEST = 'QUERY_THREADS_REQUEST';
export const QUERY_THREADS = 'QUERY_THREADS';
export const QUERY_THREADS_MESSAGES = 'QUERY_THREADS_MESSAGES';

export interface QueryThreadsAction {
	type: typeof QUERY_THREADS,
	payload: {
		threads: Thread[];
	},
}

export interface QueryThreadsMessagesAction {
	type: typeof QUERY_THREADS_MESSAGES,
	payload: {
		messages: Message[],
	},
}

export type ThreadsAction = QueryThreadsAction | QueryThreadsMessagesAction;
