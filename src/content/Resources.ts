import {ByteBufferOffset} from "@casperui/core/io/ByteBufferOffset";

export abstract class Resources {

    abstract getBufferById(id:number):ByteBufferOffset

    abstract getSVGImageBlob(id:number)

    abstract getDataString(id:number,cache?:boolean):string
}
