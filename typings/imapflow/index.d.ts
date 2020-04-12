/// <reference types="node" />

/**
 * @module imapflow
 */
declare module "imapflow" {
    import { EventEmitter } from "events";

    export type LogData = {
        src?: 'c' | 's' | string;
        cid?: string;
        [ key: string ]: any;
    };

    export type ImapFlowOptions = {
        host: string;
        port: number;
        secure?: boolean;
        servername?: string;
        disableCompression?: boolean;
        auth: {
            user: string;
            pass?: string;
            accessToken?: string;
        };
        clientInfo?: IdInfoObject;
        disableAutoIdle?: boolean;
        tls?: {
            rejectUnauthorized?: boolean;
            minVersion?: string;
            minDHSize?: number;
        };
        logger?: {
            debug(data: LogData): void;
            info(data: LogData): void;
            warn(data: LogData): void;
            error(data: LogData): void;
            trace(data: LogData): void;
            fatal(data: LogData): void;
        };
        verifyOnly?: boolean;
    };

    /**
     * @param {Object} options IMAP connection options
     * @param {String} options.host Hostname of the IMAP server
     * @param {Number} options.port Port number for the IMAP server
     * @param {Boolean} [options.secure=false] Should the connection be established over TLS.
     *      If `false` then connection is upgraded to TLS using STARTTLS extension before authentication
     * @param {String} [options.servername] Servername for SNI (or when host is set to an IP address)
     * @param {Boolean} [options.disableCompression=false] if `true` then client does not try to use COMPRESS=DEFLATE extension
     * @param {Object} options.auth Authentication options. Authentication is requested automatically during <code>connect()</code>
     * @param {String} options.auth.user Usename
     * @param {String} [options.auth.pass] Password, if using regular authentication
     * @param {String} [options.auth.accessToken] OAuth2 Access Token, if using OAuth2 authentication
     * @param {IdInfoObject} [options.clientInfo] Client identification info
     * @param {Boolean} [options.disableAutoIdle=false] if `true` then IDLE is not started automatically. Useful if you only need to perform specific tasks over the connection
     * @param {Object} [options.tls] Additional TLS options (see [Node.js TLS connect](https://nodejs.org/api/tls.html#tls_tls_connect_options_callback) for all available options)
     * @param {Boolean} [options.tls.rejectUnauthorized=true] if `false` then client accepts self-signed and expired certificates from the server
     * @param {String} [options.tls.minVersion=TLSv1.2] latest Node.js defaults to *'TLSv1.2'*, for older mail servers you might need to use something else, eg *'TLSv1'*
     * @param {Number} [options.tls.minDHSize=1024] Minimum size of the DH parameter in bits to accept a TLS connection
     * @param {Object} [options.logger] Custom logger instance with `debug(obj)`, `info(obj)`, `warn(obj)` and `error(obj)` methods. If not provided then ImapFlow logs to console using pino format
     * @param {Boolean} [options.verifyOnly=false] If `true` then logs out automatically after successful authentication
     */
    class ImapFlow extends EventEmitter {
        constructor(options: ImapFlowOptions);
        /**
         * Instance ID for logs
         * @type {String}
         */
        id: string;
        /**
         * Server identification info. Available after successful `connect()`.
         * If server does not provide identification info then this value is `null`.
         * @example
         * await client.connect();
         * console.log(client.serverInfo.vendor);
         * @type {IdInfoObject|null}
         */
        serverInfo: IdInfoObject | null;
        /**
         * Is the connection currently encrypted or not
         * @type {Boolean}
         */
        secureConnection: boolean;
        /**
         * Active IMAP capabilities. Value is either `true` for togglabe capabilities (eg. `UIDPLUS`)
         * or a number for capabilities with a value (eg. `APPENDLIMIT`)
         * @type {Map<string, boolean|number>}
         */
        capabilities: Map<string, boolean | number>;
        /**
         * Enabled capabilities. Usually `CONDSTORE` and `UTF8=ACCEPT` if server supports these.
         * @type {Set<string>}
         */
        enabled: Set<string>;
        /**
         * Is the connection currently usable or not
         * @type {Boolean}
         */
        usable: boolean;
        /**
         * Currently authenticated user or `false` if mailbox is not open
         * or `true` if connection was authenticated by PREAUTH
         * @type {String|Boolean}
         */
        authenticated: string | boolean;
        /**
         * Currently selected mailbox or `false` if mailbox is not open
         * @type {MailboxObject|Boolean}
         */
        mailbox: MailboxObject | false;
        /**
         * Is current mailbox idling (`true`) or not (`false`)
         * @type {Boolean}
         */
        idling: boolean;
        /**
         * Initiates a connection against IMAP server. Throws if anything goes wrong. This is something you have to call before you can run any IMAP commands
         *
         * @returns {Promise<void>}
         * @throws Will throw an error if connection or authentication fails
         * @example
         * let client = new ImapFlow({...});
         * await client.connect();
         */
        connect(): Promise<void>;
        /**
         * Graceful connection close by sending logout command to server. TCP connection is closed once command is finished.
         *
         * @return {Promise<void>}
         * @example
         * let client = new ImapFlow({...});
         * await client.connect();
         * ...
         * await client.logout();
         */
        logout(): Promise<void>;
        /**
         * Closes TCP connection without notifying the server.
         *
         * @example
         * let client = new ImapFlow({...});
         * await client.connect();
         * ...
         * client.close();
         */
        close(): void;
        /**
         * Returns current quota
         *
         * @param {String} [path] Optional mailbox path if you want to check quota for specific folder
         * @returns {Promise<QuotaResponse|Boolean>} Quota information or `false` if QUTOA extension is not supported or requested path does not exist
         *
         * @example
         * let quota = await client.getQuota();
         * console.log(quota.storage.used, quota.storage.available)
         */
        getQuota(path?: string): Promise<QuotaResponse | Boolean>;
        /**
         * Lists available mailboxes as an Array
         *
         * @returns {Promise<ListResponse[]>} An array of ListResponse objects
         *
         * @example
         * let list = await client.list();
         * list.forEach(mailbox=>console.log(mailbox.path));
         */
        list(): Promise<ListResponse[]>;
        /**
         * Lists available mailboxes as a tree structured object
         *
         * @returns {Promise<ListTreeResponse>} Tree structured object
         *
         * @example
         * let tree = await client.listTree();
         * tree.folders.forEach(mailbox=>console.log(mailbox.path));
         */
        listTree(): Promise<ListTreeResponse>;
        /**
         * Performs a no-op call against server
         * @returns {Promise<void>}
         */
        noop(): Promise<void>;
        /**
         * Creates a new mailbox folder and sets up subscription for the created mailbox. Throws on error.
         *
         * @param {string|array} path Full mailbox path. Unicode is allowed. If value is an array then it is joined using current delimiter symbols. Namespace prefix is added automatically if required.
         * @returns {Promise<MailboxCreateResponse>} Mailbox info
         * @throws Will throw an error if mailbox can not be created
         *
         * @example
         * let info = await client.mailboxCreate(['parent', 'child']);
         * console.log(info.path);
         * // "INBOX.parent.child" // assumes "INBOX." as namespace prefix and "." as delimiter
         */
        mailboxCreate(path: string | any[]): Promise<MailboxCreateResponse>;
        /**
         * Renames a mailbox. Throws on error.
         *
         * @param {string|array} path  Path for the mailbox to rename. Unicode is allowed. If value is an array then it is joined using current delimiter symbols. Namespace prefix is added automatically if required.
         * @param {string|array} newPath New path for the mailbox
         * @returns {Promise<MailboxRenameResponse>} Mailbox info
         * @throws Will throw an error if mailbox does not exist or can not be renamed
         *
         * @example
         * let info = await client.mailboxRename('parent.child', 'Important stuff ❗️');
         * console.log(info.newPath);
         * // "INBOX.Important stuff ❗️" // assumes "INBOX." as namespace prefix
         */
        mailboxRename(path: string | any[], newPath: string | any[]): Promise<MailboxRenameResponse>;
        /**
         * Deletes a mailbox. Throws on error.
         *
         * @param {string|array} path Path for the mailbox to delete. Unicode is allowed. If value is an array then it is joined using current delimiter symbols. Namespace prefix is added automatically if required.
         * @returns {Promise<MailboxDeleteResponse>} Mailbox info
         * @throws Will throw an error if mailbox does not exist or can not be deleted
         *
         * @example
         * let info = await client.mailboxDelete('Important stuff ❗️');
         * console.log(info.path);
         * // "INBOX.Important stuff ❗️" // assumes "INBOX." as namespace prefix
         */
        mailboxDelete(path: string | any[]): Promise<MailboxDeleteResponse>;
        /**
         * Subscribes to a mailbox
         *
         * @param {string|array} path Path for the mailbox to subscribe to. Unicode is allowed. If value is an array then it is joined using current delimiter symbols. Namespace prefix is added automatically if required.
         * @returns {Promise<Boolean>} `true` if subscription operation succeeded, `false` otherwise
         *
         * @example
         * await client.mailboxSubscribe('Important stuff ❗️');
         */
        mailboxSubscribe(path: string | any[]): Promise<Boolean>;
        /**
         * Unsubscribes from a mailbox
         *
         * @param {string|array} path **Path for the mailbox** to unsubscribe from. Unicode is allowed. If value is an array then it is joined using current delimiter symbols. Namespace prefix is added automatically if required.
         * @returns {Promise<Boolean>} `true` if unsubscription operation succeeded, `false` otherwise
         *
         * @example
         * await client.mailboxUnsubscribe('Important stuff ❗️');
         */
        mailboxUnsubscribe(path: string | any[]): Promise<Boolean>;
        /**
         * Opens a mailbox to access messages. You can perform message operations only against an opened mailbox.
         * Using {@link module:imapflow~ImapFlow#getMailboxLock|getMailboxLock()} instead of `mailboxOpen()` is preferred. Both do the same thing
         * but next `getMailboxLock()` call is not executed until previous one is released.
         *
         * @param {string|array} path **Path for the mailbox** to open
         * @param {Object} [options] optional options
         * @param {Boolean} [options.readOnly=false] If `true` then opens mailbox in read-only mode. You can still try to perform write operations but these would probably fail.
         * @returns {Promise<MailboxObject>} Mailbox info
         * @throws Will throw an error if mailbox does not exist or can not be opened
         *
         * @example
         * let mailbox = await client.mailboxOpen('Important stuff ❗️');
         * console.log(mailbox.exists);
         * // 125
         */
        mailboxOpen(path: string | any[], options?: {
            readOnly?: boolean;
        }): Promise<MailboxObject>;
        /**
         * Closes a previously opened mailbox
         *
         * @returns {Promise<Boolean>} Did the operation succeed or not
         *
         * @example
         * let mailbox = await client.mailboxOpen('INBOX');
         * await client.mailboxClose();
         */
        mailboxClose(): Promise<Boolean>;
        /**
         * Requests the status of the indicated mailbox. Only requested status values will be returned.
         *
         * @param {String} path mailbox path to check for
         * @param {Object} query defines requested status items
         * @param {Boolean} query.messages if `true` request count of messages
         * @param {Boolean} query.recent if `true` request count of messages with \\Recent tag
         * @param {Boolean} query.uidNext if `true` request predicted next UID
         * @param {Boolean} query.uidValidity if `true` request mailbox `UIDVALIDITY` value
         * @param {Boolean} query.unseen if `true` request count of unseen messages
         * @param {Boolean} query.highestModseq if `true` request last known modseq value
         * @returns {Promise<StatusObject>} status of the indicated mailbox
         *
         * @example
         * let status = await client.status('INBOX', {unseen: true});
         * console.log(status.unseen);
         * // 123
         */
        status(path: string, query: {
            messages: boolean;
            recent: boolean;
            uidNext: boolean;
            uidValidity: boolean;
            unseen: boolean;
            highestModseq: boolean;
        }): Promise<StatusObject>;
        /**
         * Starts listening for new or deleted messages from the currently opened mailbox. Only required if {@link ImapFlow#disableAutoIdle} is set to `true`
         * otherwise IDLE is started by default on connection inactivity. NB! If `idle()` is called manually then it does not
         * return until IDLE is finished which means you would have to call some other command out of scope.
         *
         * @returns {Promise<Boolean>} Did the operation succeed or not
         *
         * @example
         * let mailbox = await client.mailboxOpen('INBOX');
         *
         * await client.idle();
         */
        idle(): Promise<Boolean>;
        /**
         * Sets flags for a message or message range
         *
         * @param {SequenceString | Number[] | SearchObject} range Range to filter the messages
         * @param {string[]} Array of flags to set. Only flags that are permitted to set are used, other flags are ignored
         * @param {Object} [options]
         * @param {Boolean} [options.uid] If `true` then uses UID {@link SequenceString} instead of sequence numbers
         * @param {BigInt} [options.unchangedSince] If set then only messages with a lower or equal `modseq` value are updated. Ignored if server does not support `CONDSTORE` extension.
         * @returns {Promise<Boolean>} Did the operation succeed or not
         *
         * @example
         * let mailbox = await client.mailboxOpen('INBOX');
         * // mark all unseen messages as seen (and remove other flags)
         * await client.messageFlagsSet({seen: false}, ['\Seen]);
         */
        messageFlagsSet(range: SequenceString | Number[] | SearchObject, Array: string[], options?: {
            uid?: boolean;
            unchangedSince?: bigint;
        }): Promise<Boolean>;
        /**
         * Adds flags for a message or message range
         *
         * @param {SequenceString | Number[] | SearchObject} range Range to filter the messages
         * @param {string[]} Array of flags to set. Only flags that are permitted to set are used, other flags are ignored
         * @param {Object} [options]
         * @param {Boolean} [options.uid] If `true` then uses UID {@link SequenceString} instead of sequence numbers
         * @param {BigInt} [options.unchangedSince] If set then only messages with a lower or equal `modseq` value are updated. Ignored if server does not support `CONDSTORE` extension.
         * @returns {Promise<Boolean>} Did the operation succeed or not
         *
         * @example
         * let mailbox = await client.mailboxOpen('INBOX');
         * // mark all unseen messages as seen (and keep other flags as is)
         * await client.messageFlagsAdd({seen: false}, ['\Seen]);
         */
        messageFlagsAdd(range: SequenceString | Number[] | SearchObject, Array: string[], options?: {
            uid?: boolean;
            unchangedSince?: bigint;
        }): Promise<Boolean>;
        /**
         * Remove specific flags from a message or message range
         *
         * @param {SequenceString | Number[] | SearchObject} range Range to filter the messages
         * @param {string[]} Array of flags to remove. Only flags that are permitted to set are used, other flags are ignored
         * @param {Object} [options]
         * @param {Boolean} [options.uid] If `true` then uses UID {@link SequenceString} instead of sequence numbers
         * @param {BigInt} [options.unchangedSince] If set then only messages with a lower or equal `modseq` value are updated. Ignored if server does not support `CONDSTORE` extension.
         * @returns {Promise<Boolean>} Did the operation succeed or not
         *
         * @example
         * let mailbox = await client.mailboxOpen('INBOX');
         * // mark all seen messages as unseen by removing \\Seen flag
         * await client.messageFlagsRemove({seen: true}, ['\Seen]);
         */
        messageFlagsRemove(range: SequenceString | Number[] | SearchObject, Array: string[], options?: {
            uid?: boolean;
            unchangedSince?: bigint;
        }): Promise<Boolean>;
        /**
         * Delete messages from currently opened mailbox. Method does not indicate info about deleted messages,
         * instead you should be using {@link ImapFlow#expunge} event for this
         *
         * @param {SequenceString | Number[] | SearchObject} range Range to filter the messages
         * @param {Object} [options]
         * @param {Boolean} [options.uid] If `true` then uses UID {@link SequenceString} instead of sequence numbers
         * @returns {Promise<Boolean>} Did the operation succeed or not
         *
         * @example
         * let mailbox = await client.mailboxOpen('INBOX');
         * // delete all seen messages
         * await client.messageDelete({seen: true});
         */
        messageDelete(range: SequenceString | Number[] | SearchObject, options?: {
            uid?: boolean;
        }): Promise<Boolean>;
        /**
         * Appends a new message to a mailbox
         *
         * @param {String} path Mailbox path to upload the message to
         * @param {string|Buffer} content RFC822 formatted email message
         * @param {string[]} [flags] an array of flags to be set for the uploaded message
         * @param {Date|string} [idate=now] internal date to be set for the message
         * @returns {Promise<AppendResponseObject>} info about uploaded message
         *
         * @example
         * await client.append('INBOX', rawMessageBuffer, ['\\Seen'], new Date(2000, 1, 1));
         */
        append(path: string, content: string | Buffer, flags?: string[], idate?: Date | string): Promise<AppendResponseObject>;
        /**
         * Copies messages from current mailbox to destination mailbox
         *
         * @param {SequenceString | Number[] | SearchObject} range Range of messages to copy
         * @param {String} destination Mailbox path to copy the messages to
         * @param {Object} [options]
         * @param {Boolean} [options.uid] If `true` then uses UID {@link SequenceString} instead of sequence numbers
         * @returns {Promise<CopyResponseObject>} info about copies messages
         *
         * @example
         * await client.mailboxOpen('INBOX');
         * // copy all messages to a mailbox called "Backup" (must exist)
         * let result = await client.messageCopy('1:*', 'Backup');
         * console.log('Copied %s messages', result.uidMap.size);
         */
        messageCopy(range: SequenceString | Number[] | SearchObject, destination: string, options?: {
            uid?: boolean;
        }): Promise<CopyResponseObject>;
        /**
         * Moves messages from current mailbox to destination mailbox
         *
         * @param {SequenceString | Number[] | SearchObject} range Range of messages to move
         * @param {String} destination Mailbox path to move the messages to
         * @param {Object} [options]
         * @param {Boolean} [options.uid] If `true` then uses UID {@link SequenceString} instead of sequence numbers
         * @returns {Promise<CopyResponseObject>} info about moved messages
         *
         * @example
         * await client.mailboxOpen('INBOX');
         * // move all messages to a mailbox called "Trash" (must exist)
         * let result = await client.messageMove('1:*', 'Trash');
         * console.log('Moved %s messages', result.uidMap.size);
         */
        messageMove(range: SequenceString | Number[] | SearchObject, destination: string, options?: {
            uid?: boolean;
        }): Promise<CopyResponseObject>;
        /**
         * Search messages from currently opened mailbox
         *
         * @param {SearchObject} query Query to filter the messages
         * @param {Object} [options]
         * @param {Boolean} [options.uid] If `true` then returns UID numbers instead of sequence numbers
         * @returns {Promise<Number[]>} An array of sequence or UID numbers
         *
         * @example
         * let mailbox = await client.mailboxOpen('INBOX');
         * // find all unseen messages
         * let list = await client.search({seen: false});
         * // use OR modifier (array of 2 or more search queries)
         * let list = await client.search({
         *   seen: false,
         *   or: [
         *     {flagged: true},
         *     {from: 'andris'},
         *     {subject: 'test'}
         *   ]});
         */
        search(query: SearchObject, options?: {
            uid?: boolean;
        }): Promise<Number[] | null | false>;
        /**
         * Fetch messages from currently opened mailbox
         *
         * @param {SequenceString | Number[] | SearchObject} range Range of messages to fetch
         * @param {FetchQueryObject} query Fetch query
         * @param {Object} [options]
         * @param {Boolean} [options.uid] If `true` then uses UID numbers instead of sequence numbers for `range`
         * @param {BigInt} [options.changedSince] If set then only messages with a higher modseq value are returned. Ignored if server does not support `CONDSTORE` extension.
         * @yields {Promise<FetchMessageObject>} Message data object
         *
         * @example
         * let mailbox = await client.mailboxOpen('INBOX');
         * // fetch UID for all messages in a mailbox
         * for await (let msg of client.fetch('1:*', {uid: true})){
         *     console.log(msg.uid);
         * }
         */
        fetch(range: SequenceString | Number[] | SearchObject, query: FetchQueryObject, options?: {
            uid?: boolean;
            changedSince?: bigint;
        }): Generator<Promise<FetchMessageObject>, void>;
        /**
         * Fetch a single message from currently opened mailbox
         *
         * @param {SequenceString} seq Single UID or sequence number of the message to fetch for
         * @param {FetchQueryObject} query Fetch query
         * @param {Object} [options]
         * @param {Boolean} [options.uid] If `true` then uses UID number instead of sequence number for `seq`
         * @returns {Promise<FetchMessageObject>} Message data object
         *
         * @example
         * let mailbox = await client.mailboxOpen('INBOX');
         * // fetch UID for all messages in a mailbox
         * let lastMsg = await client.fetchOne('*', {uid: true})
         * console.log(lastMsg.uid);
         */
        fetchOne(seq: SequenceString, query: FetchQueryObject, options?: {
            uid?: boolean;
        }): Promise<FetchMessageObject>;
        /**
         * Download either full rfc822 formated message or a specific bodystructure part as a Stream.
         * Bodystructure parts are decoded so the resulting stream is a binary file. Text content
         * is automatically converted to UTF-8 charset.
         *
         * @param {SequenceString} range UID or sequence number for the message to fetch
         * @param {String} [part] If not set then downloads entire rfc822 formatted message, otherwise downloads specific bodystructure part
         * @param {Object} [options]
         * @param {Boolean} [options.uid] If `true` then uses UID number instead of sequence number for `range`
         * @param {number} [options.maxBytes] If set then limits download size to specified bytes
         * @returns {Promise<DownloadObject>} Download data object
         *
         * @example
         * let mailbox = await client.mailboxOpen('INBOX');
         * // download body part nr '1.2' from latest message
         * let {meta, content} = await client.download('*', '1.2');
         * stream.pipe(fs.createWriteStream(meta.filename));
         */
        download(range: SequenceString, part?: string, options?: {
            uid?: boolean;
            maxBytes?: number;
        }): Promise<DownloadObject>;
        /**
         * Opens a mailbox if not already open and returns a lock. Next call to `getMailboxLock()` is queued
         * until previous lock is released. This is suggested over {@link module:imapflow~ImapFlow#mailboxOpen|mailboxOpen()} as
         * `getMailboxLock()` gives you a weak transaction while `mailboxOpen()` has no guarantees whatsoever that another
         * mailbox is opened while you try to call multiple fetch or store commands.
         *
         * @param {string|array} path **Path for the mailbox** to open
         * @param {Object} [options] optional options
         * @param {Boolean} [options.readOnly=false] If `true` then opens mailbox in read-only mode. You can still try to perform write operations but these would probably fail.
         * @returns {Promise<MailboxLockObject>} Mailbox lock
         * @throws Will throw an error if mailbox does not exist or can not be opened
         *
         * @example
         * let lock = await client.getMailboxLock('INBOX');
         * try {
         *   // do something in the mailbox
         * } finally {
         *   // use finally{} to make sure lock is released even if exception occurs
         *   lock.release();
         * }
         */
        getMailboxLock(path: string | any[], options?: {
            readOnly?: boolean;
        }): Promise<MailboxLockObject>;

        on(event: 'close', listener: () => void): this;
        on(event: 'exists', listener: (data: {
            path: string;
            count: number;
            prevCount: number;
        }) => void): this;
        on(event: 'expunge', listener: (data: {
            path: string;
            seq: number;
        }) => void): this;
        on(event: 'flags', listener: (data: {
            path: string;
            seq: number;
            uid?: number;
            modseq?: bigint;
            flags: Set<string>;
        }) => void): this;
        on(event: 'log', listener: (data: object) => void): this;
        on(event: 'mailboxClose', listener: (data: MailboxObject) => void): this;
        on(event: 'mailboxOpen', listener: (data: MailboxObject) => void): this;
    }

    /**
     * @typedef {Object} MailboxObject
     * @global
     * @property {String} path mailbox path
     * @property {String} delimiter mailbox path delimiter, usually "." or "/"
     * @property {Set<string>} flags list of flags for this mailbox
     * @property {String} [specialUse] one of special-use flags (if applicable): "\All", "\Archive", "\Drafts", "\Flagged", "\Junk", "\Sent", "\Trash". Additionally INBOX has non-standard "\Inbox" flag set
     * @property {Boolean} listed `true` if mailbox was found from the output of LIST command
     * @property {Boolean} subscribed `true` if mailbox was found from the output of LSUB command
     * @property {Set<string>} permanentFlags A Set of flags available to use in this mailbox. If it is not set or includes special flag "\\\*" then any flag can be used.
     * @property {String} [mailboxId] unique mailbox ID if server has `OBJECTID` extension enabled
     * @property {BigInt} [highestModseq] latest known modseq value if server has CONDSTORE or XYMHIGHESTMODSEQ enabled
     * @property {BigInt} uidValidity Mailbox `UIDVALIDITY` value
     * @property {Number} uidNext Next predicted UID
     * @property {Number} exists Messages in this folder
     */
    type MailboxObject = {
        path: string;
        delimiter: string;
        flags: Set<string>;
        specialUse?: string;
        listed: boolean;
        subscribed: boolean;
        permanentFlags: Set<string>;
        mailboxId?: string;
        highestModseq?: bigint;
        uidValidity: bigint;
        uidNext: number;
        exists: number;
    };

    /**
     * @typedef {Object} MailboxLockObject
     * @global
     * @property {String} path mailbox path
     * @property {Function} release Release current lock
     * @example
     * let lock = await client.getMailboxLock('INBOX');
     * try {
     *   // do something in the mailbox
     * } finally {
     *   // use finally{} to make sure lock is released even if exception occurs
     *   lock.release();
     * }
     */
    type MailboxLockObject = {
        path: string;
        release: (...params: any[]) => any;
    };

    /**
     * Client and server identification object, where key is one of RFC2971 defined [data fields](https://tools.ietf.org/html/rfc2971#section-3.3) (but not limited to).
     * @typedef {Object} IdInfoObject
     * @global
     * @property {String} [name] Name of the program
     * @property {String} [version] Version number of the program
     * @property {String} [os] Name of the operating system
     * @property {String} [vendor] Vendor of the client/server
     * @property {String} ['support-url'] URL to contact for support
     * @property {Date} [date] Date program was released
     */
    type IdInfoObject = {
        name?: string;
        version?: string;
        os?: string;
        vendor?: string;
        'support-url'?: string;
        date?: Date;
    };

    /**
     * @typedef {Object} QuotaResponse
     * @global
     * @property {String} path=INBOX mailbox path this quota applies to
     * @property {Object} [storage] Storage quota if provided by server
     * @property {Number} [storage.used] used storage in bytes
     * @property {Number} [storage.limit] total storage available
     * @property {Object} [messages] Message count quota if provided by server
     * @property {Number} [messages.used] stored messages
     * @property {Number} [messages.limit] maximum messages allowed
     */
    type QuotaResponse = {
        path: string;
        storage?: {
            used?: number;
            limit?: number;
        };
        messages?: {
            used?: number;
            limit?: number;
        };
    };

    /**
     * @typedef {Object} ListResponse
     * @global
     * @property {String} path mailbox path
     * @property {String} name mailbox name (last part of path after delimiter)
     * @property {String} delimiter mailbox path delimiter, usually "." or "/"
     * @property {Set<string>} flags a set of flags for this mailbox
     * @property {String} specialUse one of special-use flags (if applicable): "\All", "\Archive", "\Drafts", "\Flagged", "\Junk", "\Sent", "\Trash". Additionally INBOX has non-standard "\Inbox" flag set
     * @property {Boolean} listed `true` if mailbox was found from the output of LIST command
     * @property {Boolean} subscribed `true` if mailbox was found from the output of LSUB command
     */
    type ListResponse = {
        path: string;
        name: string;
        delimiter: string;
        flags: Set<string>;
        specialUse: string;
        listed: boolean;
        subscribed: boolean;
    };

    /**
     * @typedef {Object} ListTreeResponse
     * @global
     * @property {Boolean} root If `true` then this is root node without any additional properties besides *folders*
     * @property {String} path mailbox path
     * @property {String} name mailbox name (last part of path after delimiter)
     * @property {String} delimiter mailbox path delimiter, usually "." or "/"
     * @property {array} flags list of flags for this mailbox
     * @property {String} specialUse one of special-use flags (if applicable): "\All", "\Archive", "\Drafts", "\Flagged", "\Junk", "\Sent", "\Trash". Additionally INBOX has non-standard "\Inbox" flag set
     * @property {Boolean} listed `true` if mailbox was found from the output of LIST command
     * @property {Boolean} subscribed `true` if mailbox was found from the output of LSUB command
     * @property {Boolean} disabled If `true` then this mailbox can not be selected in the UI
     * @property {ListTreeResponse[]} folders An array of subfolders
     */
    type ListTreeResponse = {
        root: boolean;
        path: string;
        name: string;
        delimiter: string;
        flags: any[];
        specialUse: string;
        listed: boolean;
        subscribed: boolean;
        disabled: boolean;
        folders: ListTreeResponse[];
    };

    /**
     * @typedef {Object} MailboxCreateResponse
     * @global
     * @property {String} path full mailbox path
     * @property {String} [mailboxId] unique mailbox ID if server supports `OBJECTID` extension (currently Yahoo and some others)
     * @property {Boolean} created If `true` then mailbox was created otherwise it already existed
     */
    type MailboxCreateResponse = {
        path: string;
        mailboxId?: string;
        created: boolean;
    };

    /**
     * @typedef {Object} MailboxRenameResponse
     * @global
     * @property {String} path full mailbox path that was renamed
     * @property {String} newPath new full mailbox path
     */
    type MailboxRenameResponse = {
        path: string;
        newPath: string;
    };

    /**
     * @typedef {Object} MailboxDeleteResponse
     * @global
     * @property {String} path full mailbox path that was deleted
     */
    type MailboxDeleteResponse = {
        path: string;
    };

    /**
     * @typedef {Object} StatusObject
     * @global
     * @property {String} path full mailbox path that was checked
     * @property {Number} [messages] Count of messages
     * @property {Number} [recent] Count of messages with \\Recent tag
     * @property {Number} [uidNext] Predicted next UID
     * @property {BigInt} [uidValidity] Mailbox `UIDVALIDITY` value
     * @property {Number} [unseen] Count of unseen messages
     * @property {BigInt} [highestModseq] Last known modseq value (if CONDSTORE extension is enabled)
     */
    type StatusObject = {
        path: string;
        messages?: number;
        recent?: number;
        uidNext?: number;
        uidValidity?: bigint;
        unseen?: number;
        highestModseq?: bigint;
    };

    /**
     * Sequence range string. Separate different values with commas, number ranges with colons and use \\* as the placeholder for the newest message in mailbox
     * @typedef {String} SequenceString
     * @global
     * @example
     * "1:*" // for all messages
     * "1,2,3" // for messages 1, 2 and 3
     * "1,2,4:6" // for messages 1,2,4,5,6
     * "*" // for the newest message
     */
    type SequenceString = string;

    /**
     * IMAP search query options. By default all conditions must match. In case of `or` query term at least one condition must match.
     * @typedef {Object} SearchObject
     * @global
     * @property {SequenceString} [seq] message ordering sequence range
     * @property {Boolean} [answered] Messages with (value is `true`) or without (value is `false`) \\Answered flag
     * @property {Boolean} [deleted] Messages with (value is `true`) or without (value is `false`) \\Deleted flag
     * @property {Boolean} [draft] Messages with (value is `true`) or without (value is `false`) \\Draft flag
     * @property {Boolean} [flagged] Messages with (value is `true`) or without (value is `false`) \\Flagged flag
     * @property {Boolean} [seen] Messages with (value is `true`) or without (value is `false`) \\Seen flag
     * @property {Boolean} [all] If `true` matches all messages
     * @property {Boolean} [new] If `true` matches messages that have the \\Recent flag set but not the \\Seen flag
     * @property {Boolean} [old] If `true` matches messages that do not have the \\Recent flag set
     * @property {Boolean} [recent] If `true` matches messages that have the \\Recent flag set
     * @property {String} [from] Matches From: address field
     * @property {String} [to] Matches To: address field
     * @property {String} [cc] Matches Cc: address field
     * @property {String} [bcc] Matches Bcc: address field
     * @property {String} [body] Matches message body
     * @property {String} [subject] Matches message subject
     * @property {Number} [larger] Matches messages larger than value
     * @property {Number} [smaller] Matches messages smaller than value
     * @property {SequenceString} [uid] UID sequence range
     * @property {BigInt} [modseq] Matches messages with modseq higher than value
     * @property {String} [emailId] unique email ID. Only used if server supports `OBJECTID` or `X-GM-EXT-1` extensions
     * @property {String} [threadId] unique thread ID. Only used if server supports `OBJECTID` or `X-GM-EXT-1` extensions
     * @property {Date|string} [before] Matches messages received before date
     * @property {Date|string} [on] Matches messages received on date (ignores time)
     * @property {Date|string} [since] Matches messages received after date
     * @property {Date|string} [sentBefore] Matches messages sent before date
     * @property {Date|string} [sentOn] Matches messages sent on date (ignores time)
     * @property {Date|string} [sentSince] Matches messages sent after date
     * @property {String} [keyword] Matches messages that have the custom flag set
     * @property {String} [unKeyword] Matches messages that do not have the custom flag set
     * @property {Object.<string, Boolean|String>} [header] Matches messages with header key set (if value is `true`) or messages where header partially matches (if value is a string)
     * @property {SearchObject[]} [or] An array of 2 or more {@link SearchObject} objects. At least one of these must match
     */
    type SearchObject = {
        seq?: SequenceString;
        answered?: boolean;
        deleted?: boolean;
        draft?: boolean;
        flagged?: boolean;
        seen?: boolean;
        all?: boolean;
        new?: boolean;
        old?: boolean;
        recent?: boolean;
        from?: string;
        to?: string;
        cc?: string;
        bcc?: string;
        body?: string;
        subject?: string;
        larger?: number;
        smaller?: number;
        uid?: SequenceString;
        modseq?: bigint;
        emailId?: string;
        threadId?: string;
        before?: Date | string;
        on?: Date | string;
        since?: Date | string;
        sentBefore?: Date | string;
        sentOn?: Date | string;
        sentSince?: Date | string;
        keyword?: string;
        unKeyword?: string;
        header?: {
            [key: string]: Boolean | String;
        };
        or?: SearchObject[];
    };

    /**
     * @typedef {Object} AppendResponseObject
     * @global
     * @property {String} path full mailbox path where the message was uploaded to
     * @property {BigInt} [uidValidity] mailbox `UIDVALIDITY` if server has `UIDPLUS` extension enabled
     * @property {Number} [uid] UID of the uploaded message if server has `UIDPLUS` extension enabled
     * @property {Number} [seq] sequence number of the uploaded message if path is currently selected mailbox
     */
    type AppendResponseObject = {
        path: string;
        uidValidity?: bigint;
        uid?: number;
        seq?: number;
    };

    /**
     * @typedef {Object} CopyResponseObject
     * @global
     * @property {String} path path of source mailbox
     * @property {String} destination path of destination mailbox
     * @property {BigInt} [uidValidity] destination mailbox `UIDVALIDITY` if server has `UIDPLUS` extension enabled
     * @property {Map<number, number>} [uidMap] Map of UID values (if server has `UIDPLUS` extension enabled) where key is UID in source mailbox and value is the UID for the same message in destination mailbox
     */
    type CopyResponseObject = {
        path: string;
        destination: string;
        uidValidity?: bigint;
        uidMap?: Map<number, number>;
    };

    type BodyPart = string | {
        key: string;
        start?: number;
        maxLength?: number;
    }

    /**
     * @typedef {Object} FetchQueryObject
     * @global
     * @property {Boolean} [uid] if `true` then include UID in the response
     * @property {Boolean} [flags] if `true` then include flags Set in the response
     * @property {Boolean} [bodyStructure] if `true` then include parsed BODYSTRUCTURE object in the response
     * @property {Boolean} [envelope] if `true` then include parsed ENVELOPE object in the response
     * @property {Boolean} [internalDate] if `true` then include internal date value in the response
     * @property {Boolean} [size] if `true` then include message size in the response
     * @property {boolean | Object} [source] if `true` then include full message in the response
     * @property {Number} [source.start] include full message in the response starting from *start* byte
     * @property {Number} [source.maxLength] include full message in the response, up to *maxLength* bytes
     * @property {Boolean} [threadId] if `true` then include thread ID in the response (only if server supports either `OBJECTID` or `X-GM-EXT-1` extensions)
     * @property {Boolean} [labels] if `true` then include GMail labels in the response (only if server supports `X-GM-EXT-1` extension)
     * @property {boolean | string[]} [headers] if `true` then includes full headers of the message in the response. If the value is an array of header keys then includes only headers listed in the array
     * @property {string[]} [bodyParts] An array of BODYPART identifiers to include in the response
     */
    type FetchQueryObject = {
        uid?: boolean;
        flags?: boolean;
        bodyStructure?: boolean;
        envelope?: boolean;
        internalDate?: boolean;
        size?: boolean;
        source?: true | {
            start?: number;
            maxLength?: number;
        };
        threadId?: boolean;
        labels?: boolean;
        headers?: boolean | string[];
        bodyParts?: BodyPart[];
    };

    /**
     * Parsed email address entry
     *
     * @typedef {Object} MessageAddressObject
     * @global
     * @property {String} [name] name of the address object (unicode)
     * @property {String} [address] email address
     */
    type MessageAddressObject = {
        name?: string;
        address?: string;
    };

    /**
     * Parsed IMAP ENVELOPE object
     *
     * @typedef {Object} MessageEnvelopeObject
     * @global
     * @property {Date} [date] header date
     * @property {String} [subject] message subject (unicode)
     * @property {String} [messageId] Message ID of the message
     * @property {String} [inReplyTo] Message ID from In-Reply-To header
     * @property {MessageAddressObject[]} [from] Array of addresses from the From: header
     * @property {MessageAddressObject[]} [sender] Array of addresses from the Sender: header
     * @property {MessageAddressObject[]} [replyTo] Array of addresses from the Reply-To: header
     * @property {MessageAddressObject[]} [to] Array of addresses from the To: header
     * @property {MessageAddressObject[]} [cc] Array of addresses from the Cc: header
     * @property {MessageAddressObject[]} [bcc] Array of addresses from the Bcc: header
     */
    type MessageEnvelopeObject = {
        date?: Date;
        subject?: string;
        messageId?: string;
        inReplyTo?: string;
        from?: MessageAddressObject[];
        sender?: MessageAddressObject[];
        replyTo?: MessageAddressObject[];
        to?: MessageAddressObject[];
        cc?: MessageAddressObject[];
        bcc?: MessageAddressObject[];
    };

    /**
     * Parsed IMAP BODYSTRUCTURE object
     *
     * @typedef {Object} MessageStructureObject
     * @global
     * @property {String} part Body part number. This value can be used to later fetch the contents of this part of the message
     * @property {String} type Content-Type of this node
     * @property {Object} [parameters] Additional parameters for Content-Type, eg "charset"
     * @property {String} [id] Content-ID
     * @property {String} [encoding] Transfer encoding
     * @property {Number} [size] Expected size of the node
     * @property {MessageEnvelopeObject} [envelope] message envelope of embedded RFC822 message
     * @property {String} [disposition] Content disposition
     * @property {Object} [dispositionParameters] Additional parameters for Conent-Disposition
     * @property {MessageStructureObject[]} childNodes An array of child nodes if this is a multipart node. Not present for normal nodes
     */
    type MessageStructureObject = {
        part?: string;
        type: string;
        parameters?: any;
        id?: string;
        encoding?: string;
        size?: number;
        envelope?: MessageEnvelopeObject;
        disposition?: string;
        dispositionParameters?: any;
        childNodes: MessageStructureObject[];
    };

    /**
     * Fetched message data
     *
     * @typedef {Object} FetchMessageObject
     * @global
     * @property {Number} seq message sequence number. Always included in the response
     * @property {Number} uid message UID number. Always included in the response
     * @property {Buffer} [source] message source for the requested byte range
     * @property {BigInt} [modseq] message Modseq number. Always included if the server supports CONDSTORE extension
     * @property {String} [emailId] unique email ID. Always included if server supports `OBJECTID` or `X-GM-EXT-1` extensions
     * @property {String} [threadId] unique thread ID. Only present if server supports `OBJECTID` or `X-GM-EXT-1` extension
     * @property {Set<string>} [labels] a Set of labels. Only present if server supports `X-GM-EXT-1` extension
     * @property {Number} [size] message size
     * @property {Set<string>} [flags] a set of message flags
     * @property {MessageEnvelopeObject} [envelope] message envelope
     * @property {MessageStructureObject} [bodyStructure] message body structure
     * @property {Date} [internalDate] message internal date
     * @property {Map<string, Buffer>} [bodyParts] a Map of message body parts where key is requested part identifier and value is a Buffer
     * @property {Buffer} [headers] Requested header lines as Buffer
     */
    type FetchMessageObject = {
        seq: number;
        uid: number;
        source?: Buffer;
        modseq?: bigint;
        emailId?: string;
        threadId?: string;
        labels?: Set<string>;
        size?: number;
        flags?: Set<string>;
        envelope?: MessageEnvelopeObject;
        bodyStructure?: MessageStructureObject;
        internalDate?: Date;
        bodyParts?: Map<string, Buffer>;
        headers?: Buffer;
    };

    /**
     * @typedef {Object} DownloadObject
     * @global
     * @property {Object} meta content metadata
     * @property {String} meta.contentType Content-Type of the streamed file. If part was not set then this value is "message/rfc822"
     * @property {String} [meta.charset] Charset of the body part. Text parts are automaticaly converted to UTF-8, attachments are kept as is
     * @property {String} [meta.disposition] Content-Disposition of the streamed file
     * @property {String} [meta.filename] Filename of the streamed body part
     * @property {ReadableStream} content Streamed content
     */
    type DownloadObject = {
        meta: {
            contentType: string;
            charset?: string;
            disposition?: string;
            filename?: string;
        };
        content: ReadableStream;
    };
}
