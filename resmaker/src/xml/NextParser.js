/**
 * @typedef {Object} Attr
 * @property {string} name
 * @property {string} value
 * */

/**
 * @typedef {Object} FullTag
 * @property {string} name
 * @property {Attr[]} attributes
 * @property {string} content
 * */

const DEPTH = 1
const ELEMENT = 2
const EOF = 3

class NextParser {
    /**
     * @returns {FullTag}
     */
    getFullTag(){
        return null
    }

    /**
     * @returns {number}
     */
    getDepth(){
        return null
    }
    next(){
        return 0
    }
    reset(){
    }
}

module.exports.NextParser = NextParser
module.exports.DEPTH = DEPTH
module.exports.ELEMENT = ELEMENT
module.exports.EOF = EOF
