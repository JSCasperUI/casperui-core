const {int2VarInt} = require("./BinaryUtils");
class ByteBufferOutputStream {
    constructor(size = 1024) {
        // Инициализируем буфер заданного размера или по умолчанию 1024 байта
        this.buffer = Buffer.allocUnsafe(size);
        this.offset = 0; // Текущее смещение для записи
    }

    ensureCapacity(length) {
        // Проверяем, достаточно ли места в буфере для записи данных длиной length
        const requiredLength = this.offset + length;
        if (requiredLength > this.buffer.length) {
            let newLength = requiredLength + (1024 * 32);
            // while (newLength < requiredLength) {
            //     newLength *= 2;
            // }
            // Создаем новый буфер и копируем в него данные из старого
            const newBuffer = Buffer.allocUnsafe(newLength);
            this.buffer.copy(newBuffer, 0, 0, this.offset);
            this.buffer = newBuffer;
        }
    }

    writeVarInt(value) {
        const varintBuffer = int2VarInt(value);
        this.ensureCapacity(varintBuffer.length);
        varintBuffer.copy(this.buffer, this.offset);
        this.offset += varintBuffer.length;
    }

    writeUINT16(value) {
        this.ensureCapacity(2);
        this.buffer.writeUInt16BE(value, this.offset);
        this.offset += 2;
    }

    writeUINT32(value) {
        this.ensureCapacity(4);
        this.buffer.writeUInt32BE(value, this.offset);
        this.offset += 4;
    }

    writeByte(value) {
        this.ensureCapacity(1);
        this.buffer[this.offset++] = value;
    }

    writeBytes(values) {
        let dataBuffer;
        if (Buffer.isBuffer(values)) {
            dataBuffer = values;
        } else {
            dataBuffer = Buffer.from(values);
        }
        this.ensureCapacity(dataBuffer.length);
        dataBuffer.copy(this.buffer, this.offset);
        this.offset += dataBuffer.length;
    }

    toByteArray() {
        // Возвращаем только заполненную часть буфера
        let x = this.buffer.slice(0, this.offset);
        return x
    }

    size() {
        return this.offset;
    }
}

class ByteBufferOutputStreamOld {
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
        if (values instanceof Buffer) {
            this.buf = Buffer.concat([this.buf, values])
        }else{
            this.buf = Buffer.concat([this.buf, Buffer.from(values)])
        }
    }
    toByteArray(){
        return this.buf
    }
    size(){
        return this.buf.length
    }
}

module.exports.ByteBufferOutputStream = ByteBufferOutputStream