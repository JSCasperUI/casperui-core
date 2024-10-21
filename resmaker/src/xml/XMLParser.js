const {NextParser} = require("./NextParser");

const TAG_OPEN = '<'
const TAG_CLOSE = '>'
const TAG_EQ = '='
const TAG_SLASH = '/'
const TAG_STRING = '"'
const TAG_COLON = ':'
const TAG_Q = '?'
const TAG_EOF = '\0'
function isLetterOrDigit(char) {
    const code = char.charCodeAt(0);
    if (code >= 48 && code <= 57) return true;
    if (code >= 65 && code <= 90) return true;
    if (code >= 97 && code <= 122) return true;
    return false;
}
class XMLParser extends NextParser {
    constructor() {
        super();
        this.currentToken = {type:0xFF.toString(),value:""}
        this.mInput = undefined
        this.position = -1
        this.symbol = '\0'
        this.skipNext = false
        this.inputStreamIndex = 0
        this.skipNextToken = false
        this.readTextContent = false
        this.depth = 0
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
            this.position++
            this.symbol = c
            return true
        } else {
            this.symbol = TAG_EOF
        }
        return false
    }

    nextToken() {
        if (this.skipNextToken) {
            this.skipNextToken = false
            return this.currentToken
        }
        while (this.mNext()) {
            if (this.readTextContent){
                this.readTextContent = false
                if (this.symbol !== TAG_OPEN){
                    let out = ""
                    out.append(this.symbol)
                    while (this.mNext() && this.symbol !== TAG_OPEN) {
                        out+=this.symbol
                    }
                    this.currentToken.type = TAG_STRING
                    this.currentToken.value = out.toString()
                    this.skipNext = true
//                    println("TEXT CONTENT:"+currentToken.value)
                    return this.currentToken
                }
                this.skipNext = true

            }
            switch (this.symbol) {
                case TAG_OPEN:
                case TAG_CLOSE:
                case TAG_EQ:
                case TAG_Q:
                case TAG_SLASH:
                case TAG_COLON:{
                    this.currentToken.type = this.symbol
                    return this.currentToken
                }
                case TAG_STRING:{
                    let out = ""
                    while (this.mNext() && this.symbol != '"') {
                        out+= this.symbol
                    }
                    this.currentToken.type = TAG_STRING
                    this.currentToken.value = out
                    return this.currentToken
                }
                default:{
                    if (isLetterOrDigit(this.symbol) || this.symbol == '.' || this.symbol == '_'|| this.symbol == '-') {
                        let out = ""
                        out+=this.symbol
                        while (this.mNext() && (isLetterOrDigit(this.symbol) || this.symbol == '.' || this.symbol == '_'|| this.symbol == '-')) {
                            out+=this.symbol
                        }
                        this.currentToken.type = TAG_STRING
                        this.currentToken.value = out
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
}
