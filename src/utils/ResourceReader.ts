import {ByteBufferOffset} from "@casperui/core/io/ByteBufferOffset";

export class ResourceReader {

    private mData:ArrayBuffer
    private files:Array<ByteBufferOffset>
    private names:Array<string>
    private fBuf:ByteBufferOffset

    constructor(mData:ArrayBuffer) {

        this.mData = mData

        this.files = []
        this.names = []
        this.fBuf = new ByteBufferOffset(mData,0,mData.byteLength)
        this.init()

    }

    getFileByIndex(index:number):ByteBufferOffset {
        return this.files[index]
    }
    init(){
        this.fBuf.read24BE() // header
        this.fBuf.read8BE() // VERSION
        let flags = this.fBuf.read8BE() // FLAGS
        let filesCount = this.fBuf.read16BE()
        let fileDataOffset = this.fBuf.read32BE()
        for (let i = 0; i < filesCount; i++) {
            let id = this.fBuf.read16BE()
            let name = ""
            if (flags){
                let nameSize = this.fBuf.read16BE()
                name = this.fBuf.readString(nameSize)
                this.names.push(name)
            }
            let fileSize = this.fBuf.read32BE()
            this.files.push(new ByteBufferOffset(this.mData, fileDataOffset, fileSize))

            if (name.endsWith("html")){
                // let xx = new BXMLParser(this.files[this.files.length - 1])
                // console.log(name,xx.parse())
            }
            fileDataOffset+=fileSize


        }
        console.log(this.names)
    }
}

