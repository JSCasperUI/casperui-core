import fs from "fs";
import path from "path";
import {ResourceConfig} from "@rMaker/utils/Config";
import {StringPool} from "@rMaker/resources/StringPool";
import {MainCompiler} from "@rMaker/MainCompiler";
import {IDMapper} from "@rMaker/resources/IDMapper";
import {FilesIDArray, IDArrayMake} from "@rMaker/resources/FilesIDArray";
import {AutoBinding} from "@rMaker/binder/AutoBinding";

export class Resource {
    private filesIdArray: FilesIDArray;

    private variableIdMapper = new IDMapper("id")
    languageResource: StringPool
    files: string[] = [];
    private autoBinds:AutoBinding[] = []

    constructor(private config: ResourceConfig, private resourceMaker: MainCompiler) {
        this.languageResource = new StringPool(this, resourceMaker.getLangMapper());

        if (config.widget) {
            this.filesIdArray = IDArrayMake(config.widget.name)
        } else {
            this.filesIdArray = IDArrayMake("R")
        }
        this.files = []
    }
    pushBinging(autoBindings: AutoBinding) {
        this.autoBinds.push(autoBindings)
    }
    storeBindings(){

        if (!this.config.output?.id) return

        const dirPath = path.dirname(this.config.output?.id!);
        const bindingsPath = path.join(dirPath, "bind.ts");

        let out = `import {View} from "@casperui/core/view/View";\n`
        for (const autoBind of this.autoBinds) {
            out+=autoBind.getAutoBindScript()+"\n"
        }
        fs.writeFileSync(bindingsPath,out)
    }

    getIdFilePath():string | undefined {
        return this.config.output?.id
    }
    getVarIdMapper():IDMapper {
        return this.variableIdMapper
    }
    isPrimary():boolean{
        return this.config.isPrimaryResource
    }

    createFileID() {

        return this.createIDObject(this.filesIdArray)
    }

    createIDArray() {
        return this.variableIdMapper.toStringMap()
    }

    createLangIDArray() {
        return this.languageResource.toStringMap()
    }


    createIDObject(dirId: FilesIDArray, level = 0): string {
        let out = `${dirId.name}:{\n`
        if (level === 0) {
            out = `export const ${dirId.name} = {\n${this.createIDArray()},\n${this.languageResource.toStringMap()},\n`
        }

        for (const ch of dirId.child) {
            if (ch.fieldId !== -1) {
                out += `\t${ch.name}:${ch.fieldId},\n`
            } else {
                out += `${this.createIDObject(ch, level + 1)},\n`
            }
        }
        out += "\n}"
        return out
    }

    makeIDFile() {
        if (this.config.output?.id) {
            fs.writeFileSync(this.config.output?.id, this.createFileID())
        }
    }

    scanDirectory() {
        let path = this.config.resourceDir!
        const stats = fs.statSync(path);
        if (!stats.isDirectory()) {
            throw Error("Указанный путь не является директорией.")
        }
        this.listFilesRecursively(path, this.files, this.filesIdArray.child)

        this.languageResource.findResFile()


    }

    listFilesRecursively(directory: string, list: string[] = [], idArray: FilesIDArray[] = []) {
        try {
            const entries = fs.readdirSync(directory, {withFileTypes: true});
            for (const entry of entries) {
                const fullPath = path.join(directory, entry.name);
                if (entry.isFile()) {
                    if (!list.includes(fullPath)) {
                        list.push(fullPath);
                        if (!entry.name.endsWith(".css") && !entry.name.endsWith(".tsv"))  {
                            idArray.push(IDArrayMake(path.parse(entry.name).name, this.resourceMaker.getNewId()));
                        }
                    }
                } else if (entry.isDirectory()) {
                    const dirID = IDArrayMake(entry.name);
                    this.listFilesRecursively(fullPath, list, dirID.child); // Рекурсивный вызов для поддиректории
                    idArray.push(dirID);
                }
            }
        } catch (err) {
            console.error(`Error reading directory ${directory}:`, err);
        }
    }
}

