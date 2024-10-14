import {ByteBufferOffset} from "@casperui/core/io/ByteBufferOffset";
import {Resources} from "@casperui/core/content/Resources";
import {ResourceReader} from "@casperui/core/utils/ResourceReader";

export class BinaryResources extends Resources {

    private resourceReader:ResourceReader
    private svgBlobsCache = {}
    private cache = {}
    constructor() {
        super();
        this.resourceReader = null
        this.svgBlobsCache = {}
        this.cache = {}
    }

    initResources(dataFile:ArrayBuffer) {
        this.resourceReader = new ResourceReader(dataFile)
    }


    getBufferById(id:number):ByteBufferOffset {
        let out = this.resourceReader.getFileByIndex(id)
        out.reset()
        return out
    }


    getDataString(id:number,cache = true):string{
        if (cache){
            if (this.cache[id]){
                return this.cache[id]
            }else{
                let value = this.getBufferById(id).toUTFString()
                this.cache[id] = value
                return value
            }
        }
        return this.getBufferById(id).toUTFString()
    }

    getSVGImageBlob(id:number):Blob {

        let blob = this.svgBlobsCache[id]
        if (blob) {
            return blob
        }
        blob = URL.createObjectURL(new Blob([this.getBufferById(id).toUTFString()], {type: 'image/svg+xml'}));
        this.svgBlobsCache[id] = blob
        return blob
    }
}

