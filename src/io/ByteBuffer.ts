const decoder = new TextDecoder();


export class ByteBuffer {
    public offset: number = 0;
    private view: DataView;
    buffer: Uint8Array;

    constructor(data:ArrayBuffer | Uint8Array | DataView) {
        if (data instanceof DataView) {
            this.view = data;
            this.buffer = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        } else if (data instanceof Uint8Array) {
            this.buffer = data;
            this.view = new DataView(data.buffer, data.byteOffset, data.byteLength);
        }else {
            this.buffer = new Uint8Array(data);
            this.view = new DataView(data);
        }
    }
    getSize(): number {
        return this.buffer.byteLength;
    }
    getDataView(): DataView {
        return this.view;
    }

    getUInt8Array():Uint8Array{
        return this.buffer;
    }

    readUInt32Array(items:number):Uint32Array{
        let oldPos = this.offset;
        this.offset+= items << 2
        return new Uint32Array(this.view.buffer, this.view.byteOffset+oldPos, items);
    }
    getUInt32ArrayC(offset:number,items:number):Uint32Array{
        return new Uint32Array(this.view.buffer, this.view.byteOffset+offset, items);
    }


    get(i:number):number {
        return this.view.getUint8(i)
    }

    read8BE():number {
        return this.view.getUint8(this.offset++)
    }
    read():number {
        return this.view.getUint8(this.offset++)
    }

    read16LE():number {
        let out = this.view.getUint16(this.offset, true)
        this.offset += 2
        return out
    }
    read16BE():number {
        let out = this.view.getUint16(this.offset, true)
        this.offset += 2
        return out
    }
    read24LE():number {
        let tmp = this.offset
        this.offset += 3
        return this.view.getUint32(tmp, true) >> 8
    }
    read24BE():number {
        let tmp = this.offset
        this.offset += 3
        return this.view.getUint32(tmp, true) >> 8
    }

    read32LE():number {
        let out = this.view.getUint32(this.offset, true)
        this.offset += 4
        return out
    }

    read32BE():number {
        let out = this.view.getUint32(this.offset, true)
        this.offset += 4
        return out
    }

    readIndex():number {
        let out = this.view.getUint8(this.offset)
        if (out > 127) {
            out = this.view.getUint16(this.offset, false) & 0x7FFF
            this.offset += 2
            return out
        }
        this.offset += 1
        return out
    }


    setPosition(i:number) {
        this.offset = i
    }

    position():number {
        return this.offset
    }

    toUTFString():string{
        this.reset()
        return this.readString(-1)
    }

    readVarIntString():string{
        const size = this.readIndex()
        const start = this.offset;
        const end = start + size;
        this.offset = end;
        return decoder.decode(this.buffer.subarray(start, end));
    }
    readString(size: number): string {
        if (size === -1) {
            return decoder.decode(this.view);
        }
        const start = this.offset;
        const end = start + size;
        this.offset = end;
        return decoder.decode( this.buffer.subarray(start, end));
    }
    readStringRange(start:number, size:number):string {
        return decoder.decode(new DataView(this.view.buffer, this.view.byteOffset + start, size))
    }
    inc(){
        this.offset++
    }
    positionOffset(i:number) {
        this.offset += i
    }

    reset() {
        this.offset = 0
    }

    hasRemaining():boolean {
        return this.offset !== this.buffer.byteLength
    }
}

