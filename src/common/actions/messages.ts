import { Message, MessageDetails, PartialMessage } from '../types';

export const PUSHED_MESSAGES = 'PUSHED_MESSAGES';

export const QUERY_THREAD_DETAILS_REQUEST = 'QUERY_THREAD_DETAILS_REQUEST';
export const QUERY_THREAD_DETAILS = 'QUERY_THREAD_DETAILS';

export const RECEIVE_MESSAGES = 'RECEIVE_MESSAGES';

export const UPDATE_MESSAGES = 'UPDATE_MESSAGES';

export interface PushedMessagesAction {
	type: typeof PUSHED_MESSAGES,
	payload: Message[],
}

export interface ReceiveMessagesAction {
	type: typeof RECEIVE_MESSAGES,
	payload: Message[],
}

export interface ReceiveMessagesDetailsAction {
	type: typeof QUERY_THREAD_DETAILS,
	payload: MessageDetails[],
}

export interface UpdateMessagesAction {
	type: typeof UPDATE_MESSAGES;
	payload: PartialMessage[],
}

export type MessagesAction =
	PushedMessagesAction |
	ReceiveMessagesDetailsAction |
	ReceiveMessagesAction |
	UpdateMessagesAction;
