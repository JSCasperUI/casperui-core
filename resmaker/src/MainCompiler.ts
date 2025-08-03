import fs from "fs";
import path from "path";

import {ResourceConfig} from "@rMaker/utils/Config";
import {StringPool} from "@rMaker/resources/StringPool";
import { generatePascalBindingName, generateSnakeBindingName} from "@rMaker/utils/utils";
import {Resource} from "@rMaker/resources/Resource";
import {CSSMerge} from "@rMaker/resources/CSSMerge";
import {ByteBufferOutput} from "@rMaker/io/ByteBufferOutput";
import {CasperBinary} from "@rMaker/bxml/CasperBinary";
import {SVGBinarize} from "@rMaker/bxml/SVGBinarize";
import {IDMapper} from "@rMaker/resources/IDMapper";




const CASPER_FS = {
    VERSION: 1,
    HEADER: "CFS",
    FLAGS: {
        ALLOW_FILES_PATH: 1,
    }
}

export class MainCompiler {
    private mConfigs: Resource[] = []
    private cssMerge = new CSSMerge()
    private nId: number = 0;
    private rootPath: string;
    private lang = new IDMapper("lang")

    isWithFileNames: boolean;

    constructor(configs: ResourceConfig[], rootPath: string) {
        for (const config of configs) {
            this.mConfigs.push(new Resource(config, this))
        }
        this.rootPath = rootPath
        this.isWithFileNames = false
    }
    getLangMapper():IDMapper {
        return this.lang
    }

    getNewId() {
        return this.nId++
    }


    scanAllResource() {
        for (let i = 0; i < this.mConfigs.length; i++) {
            this.mConfigs[i].scanDirectory()
        }
    }

    makeIDFiles() {
        for (let i = 0; i < this.mConfigs.length; i++) {
            this.mConfigs[i].makeIDFile()
        }
    }

    saveCSS(file: string) {
        let out = this.cssMerge.compileOutput(path.basename(file))
        if (out){
            fs.writeFileSync(file, out.cssContent)
            fs.writeFileSync(file + ".map", out.sourceMap)
        }
    }

    makeBinaryFile() {
        let output = new ByteBufferOutput()
        let filesHeader = new ByteBufferOutput()
        let dataBuffer = new ByteBufferOutput()
        let flags = 0
        let originalFileSizes = 0
        if (this.isWithFileNames) {
            flags = flags | CASPER_FS.FLAGS.ALLOW_FILES_PATH
        }
        let filesCount = 0
        let stringList: StringPool[] = []
        for (const config of this.mConfigs) {
            stringList.push(config.languageResource)
            for (const file of config.files) {

                if (file.endsWith(".css")) {
                    this.cssMerge.addCSS(file)
                    continue
                }

                filesCount++

                let byteData = fs.readFileSync(file)
                let fileOriginLength = byteData.length
                originalFileSizes += fileOriginLength

                let newPath = file.replace(this.rootPath, "")

                if (this.isWithFileNames) {
                    filesHeader.writeStringWithLength(newPath)
                }

                if (file.endsWith("xml") || file.endsWith("html")) {
                    let bin = new CasperBinary(file, config)
                    byteData = bin.html2CaperBinary(byteData.toString(), file)
                    console.log(bin.getBindings().makeResult(config.getIdFilePath()))
                } else if (file.endsWith("svg")) {
                    let bin = new SVGBinarize("svg", null!)
                    byteData = bin.html2CaperBinary(byteData.toString(), file)

                }

                filesHeader.uint32(byteData.length)
                dataBuffer.writeBytes(byteData)

                console.info(`${fileOriginLength}:${byteData.length} ${newPath}`)

            }

        }

        let binaryStringData = StringPool.compileStrings(stringList)


        filesCount++
        if (this.isWithFileNames) {
            filesHeader.writeStringWithLength("lang")
        }
        filesHeader.uint32(binaryStringData.length)
        dataBuffer.writeBytes(binaryStringData)
        console.info(`string data:${binaryStringData.length}`)
        //
        // let langData = this.lang.toStringMap()
        // filesHeader.uint32(byteData.length)
        // fileData.writeBytes(byteData)


        output.writeBytes(CASPER_FS.HEADER)
        output.uint8(CASPER_FS.VERSION)
        output.uint8(flags)
        output.uint16(filesCount)
        output.uint32(filesHeader.size() + 11) // DATA OFFSET
        output.writeBytes(filesHeader.toByteArray()) // DATA OFFSET
        output.writeBytes(dataBuffer.toByteArray())

        let bSize = Math.round(originalFileSizes / 1024.0)
        let tSize = Math.round(output.size() / 1024.0)
        console.log(`${bSize} -> ${tSize}`)
        return output.toByteArray()
    }

}

