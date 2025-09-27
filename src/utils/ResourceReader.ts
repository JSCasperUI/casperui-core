import {ByteBuffer} from "@casperui/core/io/ByteBuffer";

export class ResourceReader {

    private mData:ArrayBuffer
    private mFiles:Array<ByteBuffer>
    private mNames:Array<string>  = []
    private fBuf:ByteBuffer

    constructor(mData:ArrayBuffer) {

        this.mData = mData

        this.fBuf = new ByteBuffer(mData)
        this.initResources()


    }
    getLangFile():ByteBuffer{
        return this.mFiles[this.mFiles.length-1]
    }
    getFileByIndex(index:number):ByteBuffer {
        return this.mFiles[index]
    }
    initResources(){

        console.time("readExtendedResources")
        this.fBuf.read24BE() // header
        this.fBuf.read8BE() // VERSION
        let flags = this.fBuf.read8BE() // FLAGS
        let filesCount = this.fBuf.read16BE()
        let fileDataOffset = this.fBuf.read32BE()
        this.mFiles = new Array<ByteBuffer>(filesCount)
        const mNames = flags ? new Array<string>(filesCount) : null;
        for (let i = 0; i < filesCount; i++) {
            if (flags) {
                const nameSize = this.fBuf.read16BE();
                mNames![i] = this.fBuf.readString(nameSize);
            }
            let fileSize = this.fBuf.read32BE()

            this.mFiles[i] = new ByteBuffer(new Uint8Array(this.mData, fileDataOffset, fileSize))

            fileDataOffset+=fileSize


        }
        if (mNames) this.mNames = mNames;
        console.timeEnd("readExtendedResources")
    }
}

