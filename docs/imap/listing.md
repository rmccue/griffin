# Listing Messages

IMAP is a stateful protocol, so you need to first select a mailbox before you can do any other operations.

## Selecting a mailbox

To select a mailbox, either the `SELECT` or `EXAMINE` commands are used. `SELECT` opens the mailbox in read-write mode (i.e. like the `r+` file mode), whereas `EXAMINE` is used for read-only mode (i.e. `r`). The primary thing this affects is whether the Recent flag is affected (I *think*).

Let's use `EXAMINE INBOX` to select the inbox:

```
9 EXAMINE INBOX
* FLAGS (\Answered \Flagged \Draft \Deleted \Seen $Forwarded $Junk $MDNSent $NotJunk $NotPhishing $Phishing $label1 $label2 $label3 Junk NonJunk NotJunk cc'd facebook wp-hackers)
* OK [PERMANENTFLAGS ()] Flags permitted.
* OK [UIDVALIDITY 620541246] UIDs valid.
* 10043 EXISTS
* 0 RECENT
* OK [UIDNEXT 71899] Predicted next UID.
* OK [HIGHESTMODSEQ 10703991]
9 OK [READ-ONLY] INBOX selected. (Success)
```

The main answer shows that INBOX is now the selected inbox, and it's selected in read-only mode. We've also got a lot of additional information here. Some of these are probably apparent as to what they do, but there's a few that need more explanation.

* `10043 EXISTS` tells us that there are 10,043 messages in the mailbox (yeah, I know, I should delete some). This is useful for the sequence numbers (which I'll come back to in a moment).
* `OK [UIDNEXT 71899]` tells us that the next message will probably have UID `71899`.
* `OK [UIDVALIDITY 620541246]` tells us the UID validity **value** (not count). If this changes between connections, **any stored UIDs will become invalid**.
* `OK [HIGHESTMODSEQ 10703991]` tells us the highest mod-sequence number in the mailbox is 10703991. (This is part of the [`CONDSTORE` extension](https://tools.ietf.org/html/rfc4551#section-3.1.1))

Combined, these lines tell us about two key IDs needed for the mailbox: UIDs, and sequence numbers.


## IDs, as they relate to listing

IMAP has, like, 40 different IDs for things, but let's examine these two IDs we have now. They're crucial for working with messages.

```
Messages in IMAP4rev1 are accessed by the use of numbers.
These numbers are either message sequence numbers or unique
identifiers.
```

The two we need for listing are sequence numbers and UIDs. These are used for two different purposes, and there's historical reasons behind this, but you can mostly translate between the two when needed.

Note that both of these IDs are [Numbers](./protocol.md). They're generally monotonically-increasing, but might be reset or changed; more on that later. They're both also specifically `nz-number`s, which are non-zero unsigned 32-bit integers; in other words, they're integers between 1 and 4,294,967,295.


### Sequence numbers

First, sequence numbers. Sequence numbers are the 1-indexed position of the message in the mailbox, and like the name says, they're sequential. In other words, if you have 100 messages in the mailbox, they'll have sequence numbers 1, 2, 3, ..., 99, 100.

The `EXISTS` response tells us the maximum value (10043 in the example above). Since we know the minimum (1) and the maximum (`EXISTS` response), we could fetch every message individually by looping through the sequence numbers. This is a handy property to exploit.


### UIDs

UIDs are "unique" IDs assigned to each message, and were added in newer versions of IMAP to replace sequence numbers for querying. They're very similar to sequence numbers, except that they aren't reindexed when the number of messages in a mailbox changes.

However, they also aren't entirely unique. Specifically, UIDs are tied to the UIDVALIDITY value attached to a mailbox, and this value can change. If the value changes, then all existing UIDs are invalidated.

So, combined, the tuple of mailbox name, UIDVALIDITY, and UID is unique, but can also be invalidated. For many uses though, it is the best ID we have, not least because many commands can be prefixed with `UID`, which then fetches or searches by UID instead of sequence number.


## Sequence sets

To fetch messages, we can use the FETCH command, natch.

This command takes a "sequence set" to query. Sequence sets are comma-separated ranges, where a range is either a single ID or a start/end ID separated by a colon. Imagine these like a SQL query on the ID field, looking something like:

* `1` is like `WHERE id = 1`
* `1, 2` is like `WHERE id IN (1, 2)`
* `1:10` is like `WHERE id >= 1 AND id <= 10`
* `1,2:4,10` is like `WHERE id = 1 OR (id >= 2 AND id <= 4) OR id = 10`

The special ID `*` can be used to refer to the "largest number in use"; see the IDs section above for detail, but practically, it's the newest message. This is equivalent to the `EXISTS` response for sequence numbers, and `UIDNEXT` for UIDs.

That means you can get the newest message by fetching `*`, or you can get every message (⚠️) by fetching `1:*` (remember that IDs start at 1).

Here's the relevant ABNF along with notes:

```
seq-number      = nz-number / "*"
                    ; message sequence number (COPY, FETCH, STORE
                    ; commands) or unique identifier (UID COPY,
                    ; UID FETCH, UID STORE commands).
                    ; * represents the largest number in use.  In
                    ; the case of message sequence numbers, it is
                    ; the number of messages in a non-empty mailbox.
                    ; In the case of unique identifiers, it is the
                    ; unique identifier of the last message in the
                    ; mailbox or, if the mailbox is empty, the
                    ; mailbox's current UIDNEXT value.
                    ; The server should respond with a tagged BAD
                    ; response to a command that uses a message
                    ; sequence number greater than the number of
                    ; messages in the selected mailbox.  This
                    ; includes "*" if the selected mailbox is empty.
```


## Fetching the latest messages

Unlike modern APIs, IMAP has no real easy way to, say, get the latest 10 messages. IMAP is [fundamentally designed](./protocol.md) for a traditional client-server model rather than a REST-style approach.

But with that said, by exploiting the way these ID sequences work, we can heuristically work out how to get slices of the mailbox.

We know that the latest message is referred to as `*`. We also know that for sequence numbers, this is the same as the `EXISTS` response. So, to get the 10 latest messages, we can subtract 10 from `EXISTS`, and range it through to `*`.

```
In addition to accessing messages by relative position in the
mailbox, message sequence numbers can be used in mathematical
calculations.  For example, if an untagged "11 EXISTS" is received,
and previously an untagged "8 EXISTS" was received, three new
messages have arrived with message sequence numbers of 9, 10, and 11.
```

```
Message sequence numbers can be reassigned during the session.  For
example, when a message is permanently removed (expunged) from the
mailbox, the message sequence number for all subsequent messages is
decremented.  The number of messages in the mailbox is also
decremented.  Similarly, a new message can be assigned a message
sequence number that was once held by some other message prior to an
expunge.
```

This approach works when you only need a few messages, but is brittle when you're trying to build an email client; for example, dealing with new messages or deleted messages.


## Indexing the mailbox

A better approach is to rethink how you're loading messages entirely. IMAP is a fundamentally different protocol to REST, and you can do things that you'd never be able to get away with in a request-response web application model.

One key example of this is indexing the mailbox when you first connect. In a traditional REST approach, we'd rely on the server for pagination and sorting, but IMAP offers no such abilities. Instead, we can index the mailbox ourselves using fields that are fast to fetch. This allows querying that data back out much more quickly later.

When we connect to a mailbox, we can run a `FETCH` to retrieve only IDs and the `INTERNALDATE` field:

```
10 FETCH 1:* (UID INTERNALDATE)
```

We now have the sequence number, UID, and date for every message in the mailbox. This provides us an index where we can now easily get the 10 latest messages, or the 10 oldest messages, or paginate them however we want.

This is also faster than you might think: for an inbox with more than 10,000 messages, it takes about 2 seconds to request and parse all the response data into JS objects.

Additionally, when new messages arrive or messages are deleted, we don't need to reload the whole index, but can rather do partial updates to it (more on that later).


## Threading

Modern users expect threaded emails as standard. However, IMAP wasn't originally designed for threading.

It's possible to parse every message and generate threads ourselves using [a threading algorithm](https://www.jwz.org/doc/threading.html), but doing so requires pulling much more data for each message, as we need to dig into the headers of messages.

Luckily, the OBJECTID IMAP extension ([RFC 8474](https://tools.ietf.org/html/rfc8474)) adds a `THREADID` field to messages which we can use. (Gmail implements [its own field](https://developers.google.com/gmail/imap/imap-extensions#access_to_the_gmail_thread_id_x-gm-thrid), `X-GM-THRID`, which operates in much the same way.)

We can add this to our index:

```
10 FETCH 1:* (UID INTERNALDATE THREADID)
```

Or for Gmail:

```
10 FETCH 1:* (UID INTERNALDATE X-GM-THRID)
```

We can now build a thread index, using the newest message's `INTERNALDATE` for the thread's "last updated" time.

Roughly in JS, this would look like:

```js
const messages = [];
const threads = {};
for ( const message of fetchResults ) {
    messages.push( {
        uid: message.uid,
        date: message.internaldate,
        thread: message.threadid,
    } );

    if ( ! threads[ message.threadid ] ) {
        threads[ message.threadid ] = {
            id: message.threadid,
            messages: [],
            date: null,
        };
    }

    threads[ message.threadid ].messages.push( message.uid );
    if ( message.internaldate > threads[ message.threadid ].date ) {
        threads[ message.threadid ].date = message.internaldate;
    }
}
```

This allows us to easily query for the latest threads.


## Unique IDs

While we're here, I should probably mention that the OBJECTID extension we're using for threads also solves another problem we might run into later: unique IDs.

As mentioned in the IDs section above, UIDs can be invalidated if UIDVALIDITY changes, and they're also only unique to a specific mailbox. Because of this latter properly, if messages move between mailboxes (say, into the trash), we'd usually lose track of them, and would be unable to correlate them. The same thing occurs if a mailbox itself is renamed. Additionally, for some email servers like Gmail, mailboxes are used to expose labels over IMAP, so messages can appear in more than one mailbox at once, and can be "copied" between them easily.

To solve this, the OBJECTID extension provides a EMAILID property. This offers stronger guarantees than UIDs: namely, it persists through COPY and MOVE commands, and can also help with APPEND commands (see [sending emails](./sending.md)).

Once again, Gmail doesn't implement this extension, but [it does provide a `X-GM-MSGID` property](https://developers.google.com/gmail/imap/imap-extensions#access_to_the_gmail_unique_message_id_x-gm-msgid) which fulfills the same basic criteria.

Note an important difference with Gmail's thread and email IDs is that they are 64-bit numbers, whereas OBJECTID IDs are strings between 1 and 255 characters containing alphanumerics plus underscore and dash, and are case-sensitive. For compatibility, cast IDs to a string.

You'll likely need to keep an internal map of UIDs to message IDs, as events sent from the server only include UIDs.
