import {ByteBufferOutput} from "@rMaker/io/ByteBufferOutput";

const HEADER = [0xCA,0xBF]
const FORMAT_VERSION = 1
export const DYNAMIC_TYPE = {
    UINT_16       : 0,
    UINT_32       : 1,
    UINT_64       : 2,
    FLOAT_32      : 3,
    FLOAT_64      : 4,
    SVG_PATH      : 5,
    IDENTIFIER    : 6,
    LANG_ID       : 7,
}




export class DictionaryCodegen {
    private keys:string[] = []
    private values:Buffer[] = []
    private keysMap = new Map()
    private valuesMap = new Map()
    private treeBuffer = new ByteBufferOutput()
    private fileSize: number = 0;
    constructor(private extension:string) {
        this.extension = extension


    }

    writeAttributesLength(size:number) {
        this.treeBuffer.uint8(size)
    }

    writeAttribute(key:number, value:number) {
        this.treeBuffer.writeVarInt(key)
        this.treeBuffer.writeVarInt(value)
    }

    writeDataArray(output:ByteBufferOutput, items:any[]) {
        for (let i = 0; i < items.length; i++) {
            output.writeVarInt(items[i].length);
            output.writeBytes(items[i]);
        }
    }

    createIndexedBuffer() {

        let output = new ByteBufferOutput()
        output.writeBytes(HEADER)
        output.uint8(FORMAT_VERSION)


        output.writeVarInt(this.keys.length)   //keys count
        output.writeVarInt(this.values.length) //values count

        this.writeDataArray(output,this.keys)
        this.writeDataArray(output,this.values)

        output.writeBytes(this.treeBuffer.toByteArray())
        return output.toByteArray()
    }

    key(value:string):number {
        if (this.keysMap.has(value)){
            return this.keysMap.get(value)!
        }
        this.fileSize += value.length + 1
        this.keys.push(value)
        let index = this.keys.length - 1
        this.keysMap.set(value,index)
        return index

    }


    value(mValue:string):number {
        let tValue = Buffer.from(mValue)
        if (this.valuesMap.has(mValue)){
            return this.valuesMap.get(mValue)!
        }

        this.values.push(tValue)
        this.valuesMap.set(mValue,this.values.length - 1)
        return this.values.length - 1
    }

    valueTyped(type:number,mValue:any) {
        if (type === DYNAMIC_TYPE.IDENTIFIER){
            let tmp = Buffer.alloc(2)
            tmp.writeUInt16LE(mValue)
            mValue = tmp
        }else if  (type === DYNAMIC_TYPE.LANG_ID){
            let tmp = Buffer.alloc(2)
            tmp.writeUInt16LE(mValue)
            mValue = tmp
        }

        let tValue = Buffer.concat([Buffer.from([type]),Buffer.from(mValue)])
        let strVal = tValue.toString("hex") // to string = bad toString("hex") good
        if (this.valuesMap.has(strVal)){
            return this.valuesMap.get(strVal)
        }

        this.values.push(tValue)
        this.valuesMap.set(strVal,this.values.length - 1)
        return this.values.length - 1
    }
}

