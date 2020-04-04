# Protocol Design

Before we talk about how IMAP works, think back to the days of POP email. POP was an email protocol designed around unidirectional sync: your computer connected to the server, downloaded messages, and left.

IMAP was designed to fix the failings of POP by letting you access a remote mailbox as if it was local. This is a quaint idea in the era of the SaaS of course, but was definitely neat at the time.


## Messaging

First, let's talk message formats.

Each message from the client starts first with a message ID (technically called a "tag"), then a command, which might have some arguments. Each command then ends with a CRLF.

```
command         = tag SP (command-any / command-auth / command-nonauth /
                  command-select) CRLF
                    ; Modal based on state
```

The client gets to pick any tag it wants provided it's valid; in practice, it's alphanumeric. Usually, this is a monotonically-increasing command ID you store internally and increment on each command; you probably want format that ID as a base-10 or hex numeric string.

The server sends messages back to the client in a similar-ish format. Each line begins with either the client's tag or a `*`, indicating an "untagged response". Untagged responses indicate a response line which doesn't end the command; they are mostly used for multi-line response data, basically.

Lines from the server that start with the tag indicate the end of the command. They're then followed by a status indicator, which is either `OK`, `BAD`, or `NO` (wow, rude). `OK` is obvious, `BAD` means a client error (like HTTP 4xx), and `NO` means a server error (like HTTP 5xx).

So, running the `CAPABILITY` command might look like (`>` indicating sent data, `<` indicating received data):

```
> 1 CAPABILITY
< * CAPABILITY IMAP4rev1 UNSELECT IDLE NAMESPACE QUOTA ID XLIST CHILDREN X-GM-EXT-1 XYZZY SASL-IR AUTH=XOAUTH2 AUTH=PLAIN AUTH=PLAIN-CLIENTTOKEN AUTH=OAUTHBEARER AUTH=XOAUTH
< 1 OK Thats all she wrote! 30mb70343486wrj
```

That's one command from the client, which generates two lines of response. The first gives us a bunch of data, the second includes the tag and indicates the command's now done.


## Bi-directional messaging

So far, the protocol is probably pretty similar to others you've worked with. Client sends request, server replies with response.

But, because IMAP is a stateful connected protocol, the server can also send messages to you. It can do this whenever it feels like. These are sometimes called "unsolicited" messages; the spec spookily notes this is for "historical reasons".

These unsolicited messages look exactly like the the untagged responses, except that they just happen to be unrelated to your command.

```
There is no syntactic difference
between server data that resulted from a specific command and server
data that were sent unilaterally.
```

Basically, when you send a command, you need to know what the format of its response is, so you know whether untagged messages are related or not. You'll likely need to do that anyway if you're sending multiple commands at once, but do you really need to do that?

The spec notes that when you receive these unsolicited messages, you mostly want to note them down for later use. Generally, they'll be things from the server which indicate some other client has changed some data, and you probably need to resync or wipe the data.


## Data types

IMAP has five data types: atom, number, string, list, or nil.

"Number" is an unsigned 32-bit int. "Nil" is a lack of value, aka null.

"List" is a Lisp-style list of items: it starts with a open paren, ends with a close paren, and items are space-separated. e.g. `(1 2 3)`. You'll often see them for tuples where the position has a meaning too.

"Atom" is basically a single-word string; i.e. a bunch of characters without spaces. Atoms can contain any alphanumeric character, or some symbols: not `(`, `)`, `{`, `%`, `*`, `"`, `\\`, or `]`. They're often used for short, built-in strings (think field names or flags).

"String" is... complex. The spec allows either for binary-safe strings (i.e. length + raw data) called "literals", or for quoted strings. Quoted strings are what you usually think of as strings (i.e. `"hello mum!"`).

Literals in the original spec are specified as a character length inside curly braces followed by a CRLF (i.e. `{1234}\r\n`). You then have to wait for the server to tell you to continue before sending the data (i.e. synchronisation). [RFC7888](https://tools.ietf.org/html/rfc7888) added non-synchronising literals; they have a `+` just before the closing brace, and let you just send the data yourself straight away.

Servers indicate support for this with either the `LITERAL+` or `LITERAL-` capability, and one of these is used by all modern servers. `LITERAL-` indicates that for any string larger than 4KB you need to synchronise. It's good practice to follow this rule universally even if the server indicates `LITERAL+`; it's likely that IMAP4rev2 will make `LITERAL-` the default.
