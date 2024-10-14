const {IDArray} = require("./IDArray");
const fs = require("fs");
const path = require("path");
const {ResourceConstID} = require("./ResourceConstID");
const {ByteBufferOutputStream} = require("../bxml/ByteBufferOutputStream");
const {XML2CasBin} = require("../bxml/XML2CasBin");
const {Resource} = require("./Resource");
const {CSSMerge} = require("./CSSMerge");


const CASPER_FS = {
    VERSION:1,
    HEADER:"CFS",
    FLAGS:{
        ALLOW_FILES_PATH:1,
    }
}
class ResourceMaker {
    /**
     * @param {Object[]} configs
     */
    constructor(configs,rootPath) {
        this.mConfigs = [];
        for (const config of configs) {
            this.mConfigs.push(new Resource(config,this))
        }
        this.nId = 0
        this.rootPath = rootPath
        this.cssMerge = new CSSMerge("app.css")
        this.isWithFileNames = false
    }

    getNewId(){
        return this.nId++
    }


    scanAllResource(){
        for (let i = 0; i < this.mConfigs.length; i++) {
            this.mConfigs[i].scanDirectory()
        }
    }
    makeIDFiles(){
        for (let i = 0; i < this.mConfigs.length; i++) {
            this.mConfigs[i].makeIDFile()
        }
    }
    saveCSS(file){
        if (!file) return
        let out = this.cssMerge.compileOutput(path.basename(file))
        fs.writeFileSync(file,out.cssContent)
        fs.writeFileSync(file+".map",out.sourceMap)
    }

    makeBinaryFile(){
        let output = new ByteBufferOutputStream()
        let filesHeader = new ByteBufferOutputStream()
        let fileData = new ByteBufferOutputStream()
        let flags = 0
        let mID = 0
        let originalFileSizes = 0
        if (this.isWithFileNames){
            flags = flags | CASPER_FS.FLAGS.ALLOW_FILES_PATH
        }
        let files = 0
        for (let i = 0; i < this.mConfigs.length; i++) {
            for (const file of this.mConfigs[i].files) {
                if (file.endsWith(".css")){
                    this.cssMerge.addCSS(file)
                    continue
                }

                files++
                let byteData = fs.readFileSync(file)
                let fileOriginLength = byteData.length
                originalFileSizes+=byteData.length

                let newPath = file.replace(this.rootPath,"")
                filesHeader.writeUINT16(mID)
                if (this.isWithFileNames){
                    filesHeader.writeUINT16(newPath.length)
                    filesHeader.writeBytes(newPath)
                }

                if (file.endsWith("xml")|| file.endsWith("html")|| file.endsWith("svg")) {
                    let bin = new XML2CasBin("xml",this.mConfigs[i].resourceConstID)
                    byteData = bin.html2CaperBinary(byteData.toString(),file)
                }

                filesHeader.writeUINT32(byteData.length)
                fileData.writeBytes(byteData)

                console.info(`${fileOriginLength}:${byteData.length} ${newPath}`)
                mID++
            }

        }


        output.writeBytes(CASPER_FS.HEADER)     // 3
        output.writeByte(CASPER_FS.VERSION)     // 1 = 4
        output.writeByte(flags)                 // 1 = 5
        output.writeUINT16(files)   // 2 = 7
        output.writeUINT32(filesHeader.size()+11) // DATA OFFSET
        output.writeBytes(filesHeader.toByteArray()) // DATA OFFSET
        output.writeBytes(fileData.toByteArray())

        let bSize = Math.round(originalFileSizes/ 1024.0)
        let tSize = Math.round(output.size()/ 1024.0)
        console.log(`${bSize} -> ${tSize}`)
        return output.toByteArray()
    }



}

module.exports.ResourceMaker = ResourceMaker;