https://www.nylas.com/blog/nylas-imap-therefore-i-am/
* "UIDs (unique IDs) are persistent to a message as long as it stays in the same folder and the server’s UIDVALIDITY integer has not increased"
* "when a client starts a new session on a mailbox, it has to check the UIDVALIDITY and compare it to its local cached value, and if the server’s UIDVALIDITY is higher, it must throw away all cached local UIDs and resync from scratch"

https://www.nylas.com/blog/guide-to-imap-send-and-sync-mail/
* "a message’s UID is useless for most practical purposes. It is not unique across folders. It will change when moved to another folder. It can change when a folder is renamed (depending on the configuration of your server). It can change between sessions. It can change when the server decides it should change (reindexing, etc)"
* "This instability is why some providers like Gmail provide [their own global ID scheme](https://developers.google.com/gmail/imap/imap-extensions#access_to_the_gmail_unique_message_id_x-gm-msgid) as an extension."
* "UIDVALIDITY [...] offers no way to track a message across folders"
