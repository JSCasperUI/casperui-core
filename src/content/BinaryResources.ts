import {ByteBufferOffset} from "@casperui/core/io/ByteBufferOffset";
import {Resources} from "@casperui/core/content/Resources";
import {ResourceReader} from "@casperui/core/utils/ResourceReader";

export class BinaryResources extends Resources {

    private mResourceReader:ResourceReader
    private mSvgBlobsCache = {}
    private mCache = {}
    constructor() {
        super();
        this.mResourceReader = null
        this.mSvgBlobsCache = {}
        this.mCache = {}
    }

    initResources(dataFile:ArrayBuffer) {
        this.mResourceReader = new ResourceReader(dataFile)
    }


    getBufferById(id:number):ByteBufferOffset {
        let out = this.mResourceReader.getFileByIndex(id)
        out.reset()
        return out
    }


    getDataString(id:number,cache = true):string{
        if (cache){
            if (this.mCache[id]){
                return this.mCache[id]
            }else{
                let value = this.getBufferById(id).toUTFString()
                this.mCache[id] = value
                return value
            }
        }
        return this.getBufferById(id).toUTFString()
    }

    getSVGImageBlob(id:number):Blob {

        let blob = this.mSvgBlobsCache[id]
        if (blob) {
            return blob
        }
        blob = URL.createObjectURL(new Blob([this.getBufferById(id).toUTFString()], {type: 'image/svg+xml'}));
        this.mSvgBlobsCache[id] = blob
        return blob
    }
}

