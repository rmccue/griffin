# Practical IMAP

If you're coming from a web world, IMAP is likely a strange beast to work with. There's a bunch of reasons for this, including that IMAP is a stateful protocol, some design decisions made for a different (pre-mobile) world, and various idiosyncracies.

This guide hopes to help improve that by providing analogues and practical tips to implementing an IMAP client in the 21st century.

I've written this guide using what I know and what I've learnt. If things are unclear or incorrect, please let me know by filing an issue.


## Reading this guide

This guide is hopefully pretty approachable. With that said, I'm assuming a bit of knowledge here, so it's useful to know the following:

* A general idea of how protocols work: you'll need to understand the vague concept of how computers talk to each other. IMAP is a text-based protocol, so there's nothing super funky here. If you know what CRLF means, you'll probably be OK.
* Experience with using raw protocols: if you've ever used telnet or netcat, you'll be fine. You need to vaguely know how streams work.
* An understanding of ABNF: knowing ABNF will help you see what's valid at a glance, but isn't required.


## Contents

* [Protocol Design](./protocol.md)
* [Listing Messages](./listing.md)


## Other Resources

The following resources were super useful in trying to work out how IMAP works, and I'd recommend reading them too. I've distilled what I think are the relevant parts into this guide, but the alternative perspectives and additional info are probably useful too:

* Nylas Blog: [Developer's Guide to Integrating with IMAP](https://www.nylas.com/blog/guide-to-imap-send-and-sync-mail/)
* Nylas Blog: [Everything you need to know about IMAP](https://www.nylas.com/blog/nylas-imap-therefore-i-am/)
* [This random Gist by @karanth](https://gist.github.com/karanth/8578022)
* [Introduction to IMAP](https://nbsoftsolutions.com/blog/introduction-to-imap)
