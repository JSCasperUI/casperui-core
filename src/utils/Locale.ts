import {ByteBuffer} from "@casperui/core/io/ByteBuffer";

const EMPTY_LANG = ""
export class Locale {

    private mData:ByteBuffer
    private langData:Array<Array<string>> = []
    private langHeader:Array<string> = []
    private langIndex = 0

    constructor(mData:ByteBuffer) {
        this.mData = mData
        this.initResources()

    }

    setLanguage(language:string) {
        this.langIndex = Math.max(0, this.langHeader.indexOf(language));
    }
    getString(id:number):string {
        let line = this.langData[id]
        let value = line[this.langIndex]
        if (value.length > 0) {
            return value
        }
        return line[0]
    }

    initResources(){
        let buff = this.mData

        let langCount = buff.read8BE()
        this.langHeader = new Array<string>(langCount)
        for (let i = 0; i < langCount; i++) {
            let stringLength = buff.read8BE()
            this.langHeader[i] =buff.readString(stringLength);
        }
        let stringsCount = buff.read32LE()


        let fullStringSize = buff.read32LE()
        let allStrings = buff.readString(fullStringSize)
        this.langData = new Array<Array<string>>(stringsCount)
        let offset = 0
        for (let i = 0; i < stringsCount; i++) {
            let langStrings = new Array(langCount)
            for (let j = 0; j < langCount; j++) {
                let size =  buff.read16LE()
                if (size === 0){
                    langStrings[j] = EMPTY_LANG
                    continue
                }
                langStrings[j] = allStrings.substring(offset,offset+size)

                offset+=size
            }
            this.langData[i] = langStrings
        }

    }
}

