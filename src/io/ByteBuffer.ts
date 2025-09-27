const decoder = new TextDecoder();


export class ByteBuffer {
    private _offset: number = 0;
    private dView: DataView;
    buff: Uint8Array;

    constructor(data:ArrayBuffer | Uint8Array | DataView) {
        if (data instanceof DataView) {
            this.dView = data;
            this.buff = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        } else if (data instanceof Uint8Array) {
            this.buff = data;
            this.dView = new DataView(data.buffer, data.byteOffset, data.byteLength);
        }else {
            this.buff = new Uint8Array(data);
            this.dView = new DataView(data);
        }
    }
    getSize(): number {
        return this.buff.byteLength;
    }
    getDataView(): DataView {
        return this.dView;
    }

    getUInt8Array():Uint8Array{
        return this.buff;
    }

    readUInt32Array(items:number):Uint32Array{
        let oldPos = this._offset;
        this._offset+= items << 2
        return new Uint32Array(this.dView.buffer, this.dView.byteOffset+oldPos, items);
    }
    getUInt32ArrayC(offset:number,items:number):Uint32Array{
        return new Uint32Array(this.dView.buffer, this.dView.byteOffset+offset, items);
    }


    getByIndex(i:number):number {
        return this.dView.getUint8(i)
    }

    read8BE():number {
        return this.dView.getUint8(this._offset++)
    }


    read16LE():number {
        let out = this.dView.getUint16(this._offset, true)
        this._offset += 2
        return out
    }
    read16BE():number {
        let out = this.dView.getUint16(this._offset, true)
        this._offset += 2
        return out
    }
    read24LE():number {
        let tmp = this._offset
        this._offset += 3
        return this.dView.getUint32(tmp, true) >> 8
    }
    read24BE():number {
        let tmp = this._offset
        this._offset += 3
        return this.dView.getUint32(tmp, true) >> 8
    }

    read32LE():number {
        let out = this.dView.getUint32(this._offset, true)
        this._offset += 4
        return out
    }

    read32BE():number {
        let out = this.dView.getUint32(this._offset, true)
        this._offset += 4
        return out
    }

    readIndex():number {
        let out = this.dView.getUint8(this._offset)
        if (out > 127) {
            out = this.dView.getUint16(this._offset, false) & 0x7FFF
            this._offset += 2
            return out
        }
        this._offset++
        return out
    }


    setBufferPosition(i:number) {
        this._offset = i
    }

    getBufferPosition():number {
        return this._offset
    }

    toUTFString():string{
        this.resetBytePosition()
        return this.readString(-1)
    }

    readVarIntString():string{
        const size = this.readIndex()
        const start = this._offset;
        const end = start + size;
        this._offset = end;
        return decoder.decode(this.buff.subarray(start, end));
    }
    readString(size: number): string {
        if (size === -1) {
            return decoder.decode(this.dView);
        }
        const start = this._offset;
        const end = start + size;
        this._offset = end;
        return decoder.decode( this.buff.subarray(start, end));
    }
    readStringRange(start:number, size:number):string {
        return decoder.decode(new DataView(this.dView.buffer, this.dView.byteOffset + start, size))
    }
    inc(){
        this._offset++
    }
    positionOffset(i:number) {
        this._offset += i
    }

    resetBytePosition() {
        this._offset = 0
    }

    hasRemaining():boolean {
        return this._offset !== this.buff.byteLength
    }
}

