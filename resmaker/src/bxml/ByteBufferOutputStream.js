class ByteBufferOutputStream {
    constructor(size = 1024) {
        this.buffer = Buffer.allocUnsafe(size);
        this.offset = 0;
    }

    ensureCapacity(length) {
        const requiredLength = this.offset + length;
        if (requiredLength > this.buffer.length) {
            let newLength = requiredLength + (1024 * 32);
            const newBuffer = Buffer.allocUnsafe(newLength);
            this.buffer.copy(newBuffer, 0, 0, this.offset);
            this.buffer = newBuffer;
        }
    }

    writeVarInt(value) {
        if (value < 0 || value > 0x7FFF) {
            throw new Error("Value out of range for VarInt");
        }
        if (value > 127) {
            this.ensureCapacity(2);
            this.buffer[this.offset]    = ((value >> 8) & 0xFF) | 0x80;
            this.buffer[this.offset+1]  =  value & 0xFF
            this.offset+=2
        } else {
            this.ensureCapacity(1);
            this.buffer[this.offset] = value & 0xFF
            this.offset+=1
        }
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
        const dataBuffer = Buffer.isBuffer(values) ? values : Buffer.from(values);
        this.ensureCapacity(dataBuffer.length);
        dataBuffer.copy(this.buffer, this.offset);
        this.offset += dataBuffer.length;
    }

    toByteArray() {
        return Buffer.from(this.buffer.subarray(0, this.offset));
    }

    size() {
        return this.offset;
    }
}


module.exports.ByteBufferOutputStream = ByteBufferOutputStream