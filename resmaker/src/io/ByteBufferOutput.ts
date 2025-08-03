

export class ByteBufferOutput {
    private buffer: Buffer;
    private offset: number;
    constructor(size = 1024) {
        this.buffer = Buffer.allocUnsafe(size);
        this.offset = 0;
    }

    ensureCapacity(length:number) {
        const requiredLength = this.offset + length;
        if (requiredLength > this.buffer.length) {
            let newLength = requiredLength + (1024 * 32);
            const newBuffer = Buffer.allocUnsafe(newLength);
            this.buffer.copy(newBuffer, 0, 0, this.offset);
            this.buffer = newBuffer;
        }
    }

    writeVarInt(value:number) {
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
    uint8(value:number) {
        this.ensureCapacity(2);
        this.buffer.writeUInt8(value, this.offset++);
    }
    uint16(value:number) {
        this.ensureCapacity(2);
        this.buffer.writeUInt16LE(value, this.offset);
        this.offset += 2;
    }
    uint32(value:number) {
        this.ensureCapacity(4);
        this.buffer.writeUInt32LE(value, this.offset);
        this.offset += 4;
    }


    writeBytes(values:Buffer|string|number[]) {
        const dataBuffer = Buffer.isBuffer(values) ? values : Buffer.from(values);
        this.ensureCapacity(dataBuffer.length);
        dataBuffer.copy(this.buffer, this.offset);
        this.offset += dataBuffer.length;
    }

    writeStringWithLength8(value: string) {
        let uString = Buffer.from(value, "utf8");
        this.ensureCapacity(uString.length + 1);
        if (uString.length>255){
            throw new Error(`Value out of range for StringWithLength ${uString.length} ${uString}`);
        }
        this.buffer.writeUInt8(uString.length, this.offset);
        this.offset += 1;
        uString.copy(this.buffer, this.offset);
        this.offset += uString.length;
    }
    writeStringWithLength(value: string) {
        let uString = Buffer.from(value, "utf8");
        this.ensureCapacity(uString.length + 2);
        this.buffer.writeUInt16LE(uString.length, this.offset);
        this.offset += 2;
        uString.copy(this.buffer, this.offset);
        this.offset += uString.length;
    }

    toByteArray() {
        return Buffer.from(this.buffer.subarray(0, this.offset));
    }

    size() {
        return this.offset;
    }
}


