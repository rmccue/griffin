import * as htmlToText from 'html-to-text';
import * as iconv from 'iconv-lite';
import { FetchMessageObject, MessageStructureObject } from 'imapflow';
import { decode as decodeQuotedPrintable } from 'quoted-printable';

import { ContentPart, MessageDetails } from '../../common/types';

export type BodyParts = Required<FetchMessageObject>["bodyParts"];

export function decodePart( partData: Buffer, encoding: string, charset: string ) {
	// First, remove transfer decoding.
	let decoded: string = partData.toString( 'utf8' );
	if ( encoding === 'quoted-printable' ) {
		const qpBuffer = Buffer.from( decodeQuotedPrintable( decoded ), 'binary' );
		decoded = iconv.decode( qpBuffer, charset );
	} else if ( encoding === 'base64' ) {
		decoded = Buffer.from( decoded, 'base64' ).toString( 'utf8' );
	}

	// Then, convert charset if needed.
	if ( charset !== 'utf-8' && charset !== 'us-ascii' && charset !== 'ascii' ) {
		if ( encoding !== 'quoted-printable' ) {
			console.log( 'uh oh', charset, encoding );
		}
	}

	return decoded;
}

export function findContentParts( structure: MessageStructureObject ): ContentPart[] | null {
	if ( structure.type === 'multipart/mixed' || structure.type === 'multipart/alternative' || structure.type === 'multipart/related' ) {
		// Multipart email.

		// RFC1341 7.2.3:
		// In general, user agents that  compose  multipart/alternative
		// entities  should place the body parts in increasing order of
		// preference, that is, with the  preferred  format  last.  For
		// fancy  text,  the sending user agent should put the plainest
		// format first and the richest format  last.   Receiving  user
		// agents  should  pick  and  display  the last format they are
		// capable of  displaying.
		let possibleParts: ContentPart[] = [];
		for ( const node of structure.childNodes ) {
			const nodeParts = findContentParts( node );
			if ( ! nodeParts ) {
				continue;
			}

			possibleParts.push( ...nodeParts );
		}

		// Return the last part we can.
		return possibleParts;
	}

	if ( structure.type !== 'text/plain' && structure.type !== 'text/html' ) {
		// Unparseable, return.
		return null;
	}

	// Finally, some good fucking part.
	return [
		{
			charset: structure.parameters?.charset.toLowerCase() || 'ascii',
			encoding: structure.encoding || '7bit',
			part: structure.part ? `${ structure.part }` : 'text',
			type: structure.type,
		}
	];
}

export type DecodedBody = MessageDetails["body"];
export function decodeMessageBody( message: FetchMessageObject ): DecodedBody | null {
	if ( ! message.bodyStructure || ! message.bodyParts ) {
		return null;
	}

	const contentParts = findContentParts( message.bodyStructure );

	const body: DecodedBody = {
		autotext: null,
		html: null,
		text: null,
	};

	// Find the last HTML part, if we can.
	const htmlPart = contentParts?.find( part => part.type === 'text/html' );
	if ( htmlPart ) {
		// console.log( 'html', htmlPart.part, message.bodyParts.keys() );
		body.html = decodePart(
			message.bodyParts.get( htmlPart.part || 'text' )!,
			htmlPart.encoding,
			htmlPart.charset
		);

		// Automatically generate a text equivalent.
		body.autotext = htmlToText.fromString( body.html );
	}

	// Find a text part.
	const textPart = contentParts?.find( part => part.type === 'text/plain' );
	if ( textPart ) {
		// console.log( 'text', textPart.part, message.bodyParts.keys() );
		body.text = decodePart(
			message.bodyParts.get( textPart.part || 'text' )!,
			textPart.encoding,
			textPart.charset
		);
	} else if ( body.autotext ) {
		body.text = body.autotext;
	}

	return body;
}
