const decoder = new TextDecoder();


export class ByteBufferOffset {
    arr: DataView | undefined;
    public pos: number;
    public size: number;


    getDataView(): DataView {
        return this.arr;
    }

    getUInt8Array():Uint8Array{
        return new Uint8Array(this.arr.buffer, this.arr.byteOffset, this.size);
    }

    readUInt32Array(items:number):Uint32Array{
        let oldPos = this.pos;
        this.pos+= items << 2
        return new Uint32Array(this.arr.buffer, this.arr.byteOffset+oldPos, items);
    }
    getUInt32ArrayC(offset:number,items:number):Uint32Array{
        return new Uint32Array(this.arr.buffer, this.arr.byteOffset+offset, items);
    }

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
    read():number {
        return this.arr.getUint8(this.pos++)
    }

    read16LE():number {
        let out = this.arr.getUint16(this.pos, true)
        this.pos += 2
        return out
    }
    read16BE():number {
        let out = this.arr.getUint16(this.pos, false)
        this.pos += 2
        return out
    }
    read24LE():number {
        let tmp = this.pos
        this.pos += 3
        return this.arr.getUint32(tmp, true) >> 8
    }
    read24BE():number {
        let tmp = this.pos
        this.pos += 3
        return this.arr.getUint32(tmp, false) >> 8
    }

    read32LE():number {
        let out = this.arr.getUint32(this.pos, true)
        this.pos += 4
        return out
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

