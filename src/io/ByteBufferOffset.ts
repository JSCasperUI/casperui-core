const decoder = new TextDecoder();


export class ByteBufferOffset {
    private arr: DataView | undefined;
    public pos: number;
    public size: number;

    constructor(buffer:ArrayBuffer|ByteBufferOffset, offset:number, mSize:number) {
        this.size = mSize
        this.pos = 0
        if (buffer instanceof ArrayBuffer) {
            this.arr = new DataView(buffer, offset, mSize)
        } else if (buffer instanceof ByteBufferOffset) {
            this.arr = new DataView(buffer.arr.buffer, buffer.arr.byteOffset + offset, mSize)
        } else {
            this.arr = undefined
        }

    }

    get(i:number):number {
        return this.arr.getUint8(i)
    }

    read8BE():number {
        return this.arr.getUint8(this.pos++)
    }

    read16BE():number {
        let out = this.arr.getUint16(this.pos, false)
        this.pos += 2
        return out
    }

    read24BE():number {
        let tmp = this.pos
        this.pos += 3
//        console.log("arr.getUint32(tmp,false) ",arr.getUint32(tmp,false)shr 8 )
        return this.arr.getUint32(tmp, false) >> 8
    }

    read32BE():number {
        let out = this.arr.getUint32(this.pos, false)
        this.pos += 4
        return out
    }

    readIndex():number {
        let out = this.arr.getUint8(this.pos)
        if (out >= 128) {
            out = this.arr.getUint16(this.pos, false) & 0x7FFF
            this.pos += 2
            return out
        }
        this.pos += 1
        return out
    }


    setPosition(i:number) {
        this.pos = i
    }

    position():number {
        return this.pos
    }

    toUTFString():string{
        this.reset()
        return this.readString(-1)
    }

    readString(size:number):string {
        if (size === -1) {
            return decoder.decode(this.arr)
        }
        let text = decoder.decode(new DataView(this.arr.buffer, this.arr.byteOffset + this.pos, size))
        this.pos += size
        return text
    }

    readStringRange(start:number, size:number):string {
        return decoder.decode(new DataView(this.arr.buffer, this.arr.byteOffset + start, size))
    }

    positionOffset(i:number) {
        this.pos += i
    }

    reset() {
        this.pos = 0
    }

    hasRemaining():boolean {
        return this.pos !== this.size
    }
}

