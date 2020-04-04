// summary.ts
//
// Modern users expect to see previews of their messages when viewing a list of
// said messages. Generating this requires a little bit of trickery, as the
// IMAP protocol doesn't currently support this natively.
//
// https://tools.ietf.org/html/draft-ietf-extra-imap-fetch-preview-07:
// [...] A client-
// based algorithm needs to issue, at a minimum, a FETCH BODYSTRUCTURE
// command in order to determine which MIME [RFC2045] body part(s)
// should be represented in the preview.  Subsequently, at least one
// FETCH BODY command may be needed to retrieve body data used in
// preview generation.  These FETCH commands cannot be pipelined since
// the BODYSTRUCTURE query must be parsed on the client before the list
// of parts to be retrieved via the BODY command(s) can be determined.
//
// Additionally, it may be difficult to predict the amount of body data
// that must be retrieved to adequately represent the part via a
// preview, therefore requiring inefficient fetching of excessive data
// in order to account for this uncertainty.  For example, a preview
// algorithm to display data contained in a text/html [RFC2854] part
// will likely strip the markup tags to obtain textual content.
// However, without fetching the entire content of the part, there is no
// way to guarantee that sufficient non-tag content will exist unless
// either 1) the entire part is retrieved or 2) an additional partial
// FETCH is executed when the client determines that it does not possess
// sufficient data from a previous partial FETCH to display an adequate
// representation of the preview.

import * as htmlToText from 'html-to-text';

import { BodyParts, decodePart } from './content';
import { ContentPart } from '../../common/types';

const SUMMARY_LENGTH = 128;

// Based on wildduck: https://github.com/nodemailer/wildduck/blob/a44a9464969e95b13b9169f1927b63116fd5253a/lib/message-handler.js#L264
export function summarizeText( text: string ) {
	// console.log( `[[${ text }]]` );
	const summary = text
		// assume we get the intro text from first 2 kB
		.substr( 0, 2 * 1024 )
		// remove quoted parts
		// "> quote from previous message"
		.replace(/^>.*$/gm, '')
		// remove lines with repetetive chars
		// "---------------------"
		.replace(/^\s*(.)\1+\s*$/gm, '')
		// Remove ZWNJs (Steam emails love these)
		.replace( /\s\u200C\s/g, '' )
		// Collapse all whitespace
		.replace( /\s+/g, ' ' )
		.trim();

	if ( summary.length < SUMMARY_LENGTH ) {
		// console.log( summary );
		return summary;
	}

	// Still too long, trim back.
	let shortSummary = summary.substr( 0, SUMMARY_LENGTH );
	let lastSp = shortSummary.lastIndexOf(' ');
	if ( lastSp > 0 ) {
		shortSummary = shortSummary.substr( 0, lastSp );
	}

	// console.log( shortSummary );
	return shortSummary + '…';
}

export function summarizeHtml( html: string ) {
	// Add additional spaces to help previews be a little better.
	const helped = html
		.replace( '</td>', ' </td>' );

	const stripped = htmlToText.fromString( helped, {
		ignoreHref: true,
		ignoreImage: true,
		uppercaseHeadings: false,
		wordwrap: false,
	} );
	return summarizeText( stripped );
}

export function summarizeBodyPart( parts: BodyParts, part: ContentPart ) {
	if ( ! parts.has( part.part ) ) {
		return null;
	}

	// First, remove transfer decoding.
	let decoded: string = decodePart( parts.get( part.part )!, part.encoding, part.charset );

	if ( part.type === 'text/plain' ) {
		return summarizeText( decoded );
	}

	// Strip HTML.
	return summarizeHtml( decoded );
}
