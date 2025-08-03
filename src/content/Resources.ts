import {ByteBuffer} from "@casperui/core/io/ByteBuffer";

export abstract class Resources {

    abstract getBufferById(id:number):ByteBuffer
    abstract setLocale(value:string):void

    abstract getSVGImageBlob(id:number)

    abstract getString(id:number):string
    abstract getDataString(id:number,cache?:boolean):string
    abstract getSvgUrlBase64(id:number,cache?:boolean):string
}
