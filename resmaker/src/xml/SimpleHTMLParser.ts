const TAG_OPEN = '<'
const TAG_CLOSE = '>'
const TAG_EQ = '='
const TAG_SLASH = '/'
const TAG_STRING = '\''
const TAG_QSTRING = '"'
const TAG_COLON = ':'
const TAG_Q = '?'
const TAG_V = '!'
const TAG_T = '-'
const TAG_EOF = '\0'

function isLetterOrDigit(char: string) {
    return /^[0-9a-zA-Z]$/.test(char);
}

function isLetter(char: string) {
    return /^[a-zA-Z]$/.test(char);
}

function isEmptyChar(char: string) {
    return char === '\n' || char === '\r' || char === '\t' || char === ' '
}

export const DEPTH = 1
export const ELEMENT = 2
export const EOF = -1


interface Token {
    type: any
    value: string,
    line: number,
    start: number
}

export interface Attribute {
    name: string,
    value: string,
}

interface FullTag {
    name: string,
    attributes: Attribute[],
    content: string,
    line: number,
    start: number
}


export class SimpleHTMLParser {
    private currentToken: Token = {type: 0xFF.toString(), value: "", line: 0, start: 0}
    private position = -1
    private symbol = '\0'
    private skipNext = false
    private inputStreamIndex = 0
    private skipNextToken = false
    private readTextContent = false
    private parsedTag = false
    private depth = 0
    private lastTag = ""
    private fullTag:FullTag = {name: "", attributes: [], content: "", line: 0, start: 0}
    private decDepthOnNext = false
    private line = 1
    private start = 0

    constructor(private mInput: string) {

    }


    mNext_old() {
        console.log("mNext",this.inputStreamIndex,this.mInput.length )
        if (this.skipNext) {
            this.skipNext = false
            return true
        }
        let c = -1
        if (this.mInput.length > this.inputStreamIndex - 1) {
            // @ts-ignore
            c = this.mInput[this.inputStreamIndex++]
        }
        if (c !== -1) {
            // @ts-ignore
            if (c === '\n') {
                this.line++
                this.start = -1
            }
            this.start++
            this.position++
            // @ts-ignore
            this.symbol = c
            return true
        } else {
            this.symbol = TAG_EOF
        }
        return false
    }
    mNext(): boolean {
        if (this.skipNext) {
            this.skipNext = false;
            return true;
        }
        if (this.inputStreamIndex < this.mInput.length) {
            const c = this.mInput[this.inputStreamIndex++];

            if (c === '\n') {
                this.line++;
                this.start = -1;
            }
            this.start++;
            this.position++;
            this.symbol = c;
            return true;
        }
        this.symbol = TAG_EOF;
        return false;
    }
    nextToken(isCommentWaiting = false) {
        if (this.skipNextToken) {
            this.skipNextToken = false
            return this.currentToken
        }
        while (this.mNext()) {
            this.currentToken.line = this.line
            this.currentToken.start = this.start
            this.currentToken.value = ""

            switch (this.symbol) {
                case TAG_EOF:{
                    this.currentToken.type = this.symbol
                    this.currentToken.value = this.symbol.toString()
                    return this.currentToken
                }
                case TAG_OPEN:
                case TAG_CLOSE:
                case TAG_EQ:
                case TAG_Q:
                case TAG_SLASH:
                case TAG_COLON:
                case TAG_V:
                case TAG_T: {

                    this.currentToken.type = this.symbol
                    this.currentToken.value = this.symbol.toString()
                    return this.currentToken
                }
                case TAG_QSTRING: {
                    let out = ""
                    while (this.mNext() && this.symbol !== '"' && this.symbol !== TAG_EOF) {
                        out += this.symbol
                    }
                    this.currentToken.type = TAG_QSTRING
                    this.currentToken.value = out.toString()
                    return this.currentToken
                }
                default: {
                    if (isCommentWaiting && this.symbol !== "-") {
                        continue
                    }
                    if (this.currentToken.type === TAG_CLOSE) {
                        let out = this.symbol
                        var e = 1
                        var p = 0
                        if (isEmptyChar(this.symbol)) {
                            p++
                        }
                        while (this.mNext() && this.symbol !== TAG_OPEN && (this.symbol as any) !== TAG_EOF) {
                            if (isEmptyChar(this.symbol)) {
                                p++
                            }
                            out += this.symbol
                            e++
                        }
                        if (e === p) {
                            this.skipNext = true
                            this.currentToken.value = ""
                            continue
                        }
                        this.currentToken.type = TAG_STRING
                        this.currentToken.value = out
                        this.skipNext = true
                        return this.currentToken
                    } else if (isLetterOrDigit(this.symbol)) {
                        let out = this.symbol
                        while (this.mNext() && (isLetterOrDigit(this.symbol) || this.symbol === '.' || this.symbol === '_' || this.symbol === '-') ) {
                            out += this.symbol
                        }
                        this.currentToken.type = TAG_STRING
                        this.currentToken.value = out
                        this.lastTag = out
                        this.skipNext = true
                        return this.currentToken
                    } else {
                        continue
                    }
                }
            }

        }
        this.currentToken.type = TAG_EOF
        return this.currentToken
    }

    getDepth() {
        return this.depth
    }

    skipComment() {
        let endTag = 2
        this.nextToken()// eat -
        while (this.nextToken(true).type !== TAG_EOF) {

            if (this.currentToken.type === TAG_T) {
                endTag--
            } else {
                if (this.currentToken.type === TAG_CLOSE && endTag === 0) {
                    break
                }
                endTag = 2
            }
        }
    }

    skipCommentSlash() {
        while (this.nextToken().type !== TAG_OPEN) {

        }
    }

    skipXML() {
        while (this.nextToken().type !== TAG_CLOSE) {

        }
    }

    getFullTag() {
        return this.fullTag
    }

    parseString() {
        let out = ""
        out += this.currentToken.value
        if (this.nextToken().type === TAG_COLON) {
            out += this.currentToken.type
            out += this.nextToken().value
        } else {
            this.skipNextToken = true
        }
        return out
    }

    parseAttrs() {
        if (this.currentToken.type === TAG_STRING) {
            while (this.currentToken.type === TAG_STRING) {
                let name = this.parseString()
                let value = ""
                if (this.nextToken().type === TAG_EQ) {
                    this.nextToken()
                    value = this.parseString()
                } else {
                    this.skipNextToken = true

                }

                this.fullTag.attributes.push({name, value})
                this.nextToken()
            }
            this.skipNextToken = true
        }

    }

    parseTag() {
        this.nextToken()


        if (this.currentToken.type === TAG_Q) {
            this.skipXML()
            this.parse()
            return;
        }

        if (this.currentToken.type === TAG_V) {
            if (this.nextToken().type === TAG_T) {
                this.skipComment()
                this.parse()
                return;
            } else if (this.currentToken.type === TAG_STRING) {
                this.skipXML()
                this.parse()
                return;
            }
        }
        if (this.currentToken.type === TAG_SLASH) {


            if (this.nextToken().type === TAG_STRING) {
                if (this.fullTag.name === "script") {
                }
                this.nextToken(); // EAT >
            } else if (this.currentToken.type === TAG_SLASH) {
                this.skipCommentSlash()
                this.skipNextToken = true
                this.parseTag()
                return;
            }
            this.depth--;
            return;
        }


        if (this.currentToken.type === TAG_STRING) {
            this.depth++;
            this.parsedTag = true;
            this.fullTag = {name: this.currentToken.value, attributes: [], content: "", line: this.currentToken.line,start:0};
            if (this.fullTag.name === "script") {
            }
            while (this.nextToken().type !== TAG_CLOSE && this.currentToken.type !== TAG_SLASH && this.currentToken.type !== TAG_EOF) {
                this.parseAttrs();
            }
            if (this.currentToken.type === TAG_SLASH) {
                this.nextToken(); // EAT >
                this.decDepthOnNext = true;
            }
        }
    }

    parse() {
        if (this.decDepthOnNext) {
            this.decDepthOnNext = false
            this.depth--
            return
        }
        this.nextToken()

        switch (this.currentToken.type) {
            case TAG_OPEN:
            case TAG_SLASH: {
                this.parseTag()
                break
            }

            default: {
                this.parseText();
            }
        }

    }

    parseText() {
        this.depth++;
        this.parsedTag = true;

        this.fullTag = {
            name: "#text",
            attributes: [],
            content: this.currentToken.value,
            line:0,
            start:0
        };

        if (this.currentToken.type !== TAG_STRING) {
            let stringValue = this.currentToken.value
            while (this.nextToken().type !== TAG_OPEN) {
                stringValue += this.currentToken.value
            }
            this.fullTag.content = stringValue
            this.skipNextToken = true

        }
        this.decDepthOnNext = true

    }

    next() {
        this.parsedTag = false
        while (this.currentToken.type !== TAG_EOF) {
            this.parse()
            if (this.parsedTag) {
                return ELEMENT
            } else {
                return DEPTH
            }

        }

        return EOF
    }
}

