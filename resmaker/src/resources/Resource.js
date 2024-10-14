const {ResourceConstID} = require("./ResourceConstID");
const {IDArray} = require("./IDArray");
const fs = require("fs");
const path = require("path");

class Resource {
    constructor(config,maker) {
        this.config = config;
        this.maker = maker
        if (config.widget){
            this.idArray = new IDArray(config.name)
        }else{
            this.idArray = new IDArray("R")
        }
        this.resourceConstID = new ResourceConstID()
        this.files = []
    }

    createFileID(){
        // let out = this.createIDObject(this.idArray)
        // out+=`\nmodule.exports.R = R;`
        return this.createIDObject(this.idArray)
    }

    createIDArray(){
        let out = "id:{\n"
        for (let i = 0; i < this.resourceConstID.listIdName.length; i++) {
            out+=`\t${this.resourceConstID.listIdName[i]}:${i},\n`
        }
        out+= "\n}"
        return out
    }

    /**
     * @param {IDArray} dirId
     * @param level
     */
    createIDObject(dirId,level = 0){
        let out = `${dirId.name}:{\n`
        if (level === 0){
            out = `export const ${dirId.name} = {\n${this.createIDArray()},\n`
        }

        for (const ch of dirId.child) {
            if (ch.fieldId !== -1){
                out+=`\t${ch.name}:${ch.fieldId},\n`
            }else{
                out+=`${this.createIDObject(ch,level+1)},\n`
            }
        }
        out+= "\n}"
        return out
    }

    makeIDFile(){
        if (this.config.id_file){
            fs.writeFileSync(this.config.id_file,this.createFileID())
        }
    }

    scanDirectory(){
        let path = this.config.resource_folder
        const stats = fs.statSync(path);
        if (!stats.isDirectory()) {
            throw Error("Указанный путь не является директорией.")
        }
        this.listFilesRecursively(path,this.files,this.idArray.child)


    }
    listFilesRecursively(directory, list = [], idArray = []) {
        try {
            const entries = fs.readdirSync(directory, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(directory, entry.name);
                if (entry.isFile()) {
                    if (!list.includes(fullPath)) {
                        list.push(fullPath);
                        if (!entry.name.endsWith(".css")){
                            idArray.push(new IDArray(path.parse(entry.name).name, this.maker.getNewId()));
                        }
                    }
                } else if (entry.isDirectory()) {
                    const dirID = new IDArray(entry.name);
                    this.listFilesRecursively(fullPath, list, dirID.child); // Рекурсивный вызов для поддиректории
                    idArray.push(dirID);
                }
            }
        } catch (err) {
            console.error(`Error reading directory ${directory}:`, err);
        }
    }
}

module.exports.Resource = Resource;