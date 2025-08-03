import {Resources} from "@casperui/core/content/Resources";
import {ResourceReader} from "@casperui/core/utils/ResourceReader";
import {ByteBuffer} from "@casperui/core/io/ByteBuffer";
import {Locale} from "@casperui/core/utils/Locale";

export class BinaryResources extends Resources {

    setLocale(value: string): void {
        this.locale.setLanguage(value);
    }

    private mResourceReader:ResourceReader
    private mSvgBlobsCache = {}
    private mCache = {}
    private locale: Locale;
    constructor() {
        super();
        this.mResourceReader = null
        this.mSvgBlobsCache = {}
        this.mCache = {}
    }

    initResources(dataFile:ArrayBuffer) {
        this.mResourceReader = new ResourceReader(dataFile)
        this.locale = new Locale(this.mResourceReader.getLangFile())
    }


    getBufferById(id:number):ByteBuffer {
        let out = this.mResourceReader.getFileByIndex(id)
        out.reset()
        return out
    }


    getString(id: number): string {
        return this.locale.getString(id);
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
    getSvgUrlBase64(id: number, cache?: boolean): string {
        return `url(data:image/svg+xml;base64,${btoa(this.getDataString(id,cache))})`;
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

