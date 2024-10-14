const {int2VarInt} = require("./BinaryUtils");

class ByteBufferOutputStream {
    constructor(size) {

        this.buf = Buffer.alloc(0)
    }

    writeVarInt(value){
        this.buf = Buffer.concat([this.buf, int2VarInt(value)])
    }
    writeUINT16(value){
        let buff = Buffer.alloc(2)
        buff.writeUInt16BE(value)
        this.buf = Buffer.concat([this.buf, buff])
    }
    writeUINT32(value){
        let buff = Buffer.alloc(4)
        buff.writeUInt32BE(value)
        this.buf = Buffer.concat([this.buf, buff])
    }
    writeByte(value){
        this.buf = Buffer.concat([this.buf, Buffer.from([value])])
    }
    writeBytes(values){

        this.buf = Buffer.concat([this.buf, Buffer.from(values)])
    }
    toByteArray(){
        return this.buf
    }
    size(){
        return this.buf.length
    }
}

module.exports.ByteBufferOutputStream = ByteBufferOutputStream