const {NextParser, ELEMENT, DEPTH, EOF} = require("./NextParser");

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
function isLetterOrDigit(char) {
    return /^[0-9a-zA-Z]$/.test(char);
}
function isLetter(char) {
    return /^[a-zA-Z]$/.test(char);
}
const EMPTY_TAG = ["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"]

function isEmptyChar(char){
    return char === '\n' || char === '\r'|| char === '\t'|| char === ' '
}
class HTMLParser extends NextParser {
    ;
    constructor() {
        super();
        this.isInScript = false
        this.currentToken = {type:0xFF.toString(),value:""}
        this.mInput = undefined
        this.position = -1
        this.symbol = '\0'
        this.skipNext = false
        this.inputStreamIndex = 0
        this.skipNextToken = false
        this.readTextContent = false
        this.parsedTag = false
        this.depth = 0
        this.lastTag = ""
        this.fullTag = {name:"",attributes:[],content:""}
        this.decDepthOnNext = false
        this.line = 1
        this.start = 0
    }


    mNext(){
        if (this.skipNext) {
            this.skipNext = false
            return true
        }
        let c = -1
        if (this.mInput.length>this.inputStreamIndex-1){
            c = this.mInput[this.inputStreamIndex++]
        }
        if (c !== -1) {
            if (c === '\n') {
                this.line++
                this.start= -1
            }
            this.start++
            this.position++
            this.symbol = c
            return true
        } else {
            this.symbol = TAG_EOF
        }
        return false
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
            if (this.isInScript) {
                if (this.symbol === '<' && this.mInput[this.inputStreamIndex] === '/') {
                    let tempPos = this.inputStreamIndex;
                    let tempStr = '';
                    while (tempPos < this.mInput.length && this.mInput[tempPos] !== '>') {
                        tempStr += this.mInput[tempPos];
                        tempPos++;
                    }
                    if (tempStr === '/script') {
                        this.currentToken.type = TAG_OPEN;
                        this.currentToken.value = this.symbol;
                        this.skipNext = true;
                        return this.currentToken;
                    }
                }
                let out = this.symbol;
                while (this.mNext() && !(this.symbol === '<' && this.mInput[this.inputStreamIndex] === '/')) {
                    out += this.symbol;
                }
                this.currentToken.type = TAG_STRING;
                this.currentToken.value = out;
                return this.currentToken;
            }

            switch (this.symbol) {
                case TAG_OPEN:
                case TAG_CLOSE:
                case TAG_EQ:
                case TAG_Q:
                case TAG_SLASH:
                case TAG_COLON:
                case TAG_V:
                case TAG_T:{
                    this.currentToken.type = this.symbol
                    this.currentToken.value = this.symbol.toString()
                    return this.currentToken
                }
                case TAG_QSTRING:{
                    let out = ""
                    while (this.mNext() && this.symbol !== '"') {
                        out+=this.symbol
                    }
                    this.currentToken.type = TAG_QSTRING
                    this.currentToken.value = out.toString()
                    return this.currentToken
                }
                default:{
                    if (isCommentWaiting && this.symbol !=="-"){
                        continue
                    }
                    if (this.currentToken.type === TAG_CLOSE) {
                        let out = this.symbol
                        var e = 1
                        var p = 0
                        if (isEmptyChar(this.symbol)){
                            p++
                        }
                        while (this.mNext() && this.symbol !== TAG_OPEN) {
                            if (isEmptyChar(this.symbol)){
                                p++
                            }
                            out+=this.symbol
                            e++
                        }
                        if (e === p){
                            this.skipNext = true
                            this.currentToken.value = ""
                            continue
                        }
                        this.currentToken.type = TAG_STRING
                        this.currentToken.value = out
                        this.skipNext = true
                        return this.currentToken
                    }else if (isLetterOrDigit(this.symbol)) {
                        let out = this.symbol
                        while (this.mNext() && (isLetterOrDigit(this.symbol) || this.symbol === '.' || this.symbol === '_' ||this.symbol === '-')) {
                            out+=this.symbol
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
    getDepth(){
        return this.depth
    }

    skipComment() {
        let endTag = 2
        while (this.nextToken(true).type!== TAG_EOF) {

            if (this.currentToken.type === TAG_T){
                endTag--
            }else{
                if (this.currentToken.type === TAG_CLOSE && endTag === 0){

                    break
                }
                endTag = 2
            }

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
        out+=this.currentToken.value
        if (this.nextToken().type === TAG_COLON ) {
            out+=this.currentToken.type
            out+=this.nextToken().value
        } else {
            this.skipNextToken = true
        }
        return out
    }
    parseAttrs() {
        if (this.currentToken.type === TAG_STRING){
            while (this.currentToken.type === TAG_STRING) {
                let name = this.parseString()
                let value = ""
                if ( this.nextToken().type === TAG_EQ){
                    this.nextToken()
                    value = this.parseString()
                }else{
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
            if (this.nextToken().type === TAG_T ){
                this.skipComment()
                this.parse()
                return;
            }else if (this.currentToken.type === TAG_STRING){
                this.skipXML()
                this.parse()
                return;
            }
        }
        if (this.currentToken.type === TAG_SLASH) {
            if (this.nextToken().type === TAG_STRING) {
                if (this.fullTag.name === "script") {
                    this.isInScript = false;
                }
                this.nextToken(); // EAT >
            }
            this.depth--;
            return;
        }
        if (this.currentToken.type === TAG_STRING) {
            this.depth++;
            this.parsedTag = true;
            this.fullTag = {name: this.currentToken.value, attributes: [], content: "",line:this.currentToken.line};
            if (this.fullTag.name === "script") {
                this.isInScript = false;
            }
            while (this.nextToken().type !== TAG_CLOSE && this.currentToken.type !== TAG_SLASH) {
                this.parseAttrs();
            }
            if (this.currentToken.type === TAG_SLASH) {
                this.nextToken(); // EAT >
                this.decDepthOnNext = true;
            }
        }
    }
    parse() {
        if (this.decDepthOnNext){
            this.decDepthOnNext = false
            this.depth--
            return
        }
        this.nextToken()

        switch (this.currentToken.type){
            case TAG_OPEN:
            case TAG_SLASH:{
                this.parseTag()
                break
            }
            case TAG_STRING:{
                this.parseText();
            }
        }

    }
    parseText() {
        if (this.currentToken.type === TAG_STRING) {
            this.depth++;
            this.parsedTag = true;
            this.fullTag = {
                name: "#text",
                attributes: [],
                content: this.currentToken.value
            };
            //this.nextToken()
            this.decDepthOnNext = true
        }
    }
    next() {
        this.parsedTag = false
        while (this.currentToken.type !== TAG_EOF){
            this.parse()
            if (this.parsedTag){
                return ELEMENT
            }else{
                return DEPTH
            }

        }

        return EOF
    }
}

module.exports.HTMLParser = HTMLParser
