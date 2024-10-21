const {ByteBufferOutputStream} = require("./ByteBufferOutputStream");

const DIR = {
    LINE:0,
    INSIDE_LINE:0x40,
    INSIDE_BACK:0x80,
    BACK:0xC0,
}
module.exports.DIR = DIR
const HEADER = "CASB"
const VERSION = 1
const DYNAMIC_TYPE = {
    IDENTIFIER     : 16,
    UINT_16        : 17,
    FLOAT_64       : 18,
    UINT_32        : 19,
    UINT_64        : 21,
    FLOAT_32       : 22,
    SVG_PATH       : 23,
    EXTENSION      : 24,
}
module.exports.DYNAMIC_TYPE = DYNAMIC_TYPE
class Dictionary {
    constructor(extension) {
        this.extension = extension
        this.tags = ["#t"]
        this.keys = []
        this.values = []
        this.valuesMap = new Map()
        this.keysMap = new Map()
        this.tagsMap = new Map()


        this.fileSize = 0
        this.treeBuffer = new ByteBufferOutputStream()
        this.output = new ByteBufferOutputStream()

    }

    writeTag(tag) {
        this.treeBuffer.writeVarInt(tag)
    }
    writeAttributesLengthAndDirection(size, dir) {
        this.treeBuffer.writeByte(size | dir)
    }
    writeAttribute(key, value) {
        this.treeBuffer.writeVarInt(key)
        this.treeBuffer.writeVarInt(value)
    }
    createIndexedBuffer() {
        console.log("createIndexedBuffer")
        this.output.writeBytes(HEADER)
        this.output.writeByte(VERSION)
        this.output.writeVarInt(this.tags.length)
        this.output.writeVarInt(this.keys.length)
        this.output.writeVarInt(this.values.length)
        for (const str of this.tags) {
            this.output.writeVarInt(str.length)
            this.output.writeBytes(str)
        }
        for (const str of this.keys) {
            this.output.writeVarInt(str.length)
            this.output.writeBytes(str)
        }

        for (let i = 0; i < this.values.length; i++) {
            this.output.writeVarInt(this.values[i].length)
            this.output.writeBytes(this.values[i])
        }
        // for (const str of this.values) {
        //     this.output.writeVarInt(str.length)
        //     this.output.writeBytes(str)
        // }

        this.output.writeBytes(this.treeBuffer.toByteArray())
        return this.output.toByteArray()
    }
    tag(value) {
        if (value === "#text"){
            return 0
        }

        if (this.tagsMap.has(value)){
            return this.tagsMap.get(value)
        }

        this.fileSize += value.length + 1
        this.tags.push(value)
        let index =this.tags.length - 1
        this.tagsMap.set(value,index)
        return index
    }

    key(value) {
        if (this.keysMap.has(value)){
            return this.keysMap.get(value)
        }
        this.fileSize += value.length + 1
        this.keys.push(value)
        let index = this.keys.length - 1
        this.keysMap.set(value,index)
        return index

    }


    value(mValue) {
        let tValue = Buffer.from(mValue.trim())
        let valString = tValue.toString()
        if (this.valuesMap.has(valString)){
            return this.valuesMap.get(valString)
        }
        // for (let i = 0; i < this.values.length; i++) {
        //     if (tValue.equals(this.values[i])){
        //         return i
        //     }
        // }

        this.fileSize += tValue.length + 1
        this.values.push(tValue)

        this.valuesMap.set(valString,this.values.length - 1)
        return this.values.length - 1
    }

    valueTyped(type,mValue) {
        if (type === DYNAMIC_TYPE.IDENTIFIER){
            let tmp = Buffer.alloc(2)
            tmp.writeUInt16BE(mValue)
            mValue = tmp
        }

        let tValue = Buffer.concat([Buffer.from([type]),Buffer.from(mValue)])
        for (let i = 0; i < this.values.length; i++) {
            if (tValue.equals(this.values[i])){
                return i
            }
        }
        this.fileSize += tValue.length + 1
        this.values.push(tValue)
        return this.values.length - 1
    }
}

module.exports.Dictionary = Dictionary