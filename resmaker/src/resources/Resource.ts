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
    private autoBinds: AutoBinding[] = []
    idStartName = "R"
    constructor(private config: ResourceConfig, private resourceMaker: MainCompiler) {
        this.languageResource = new StringPool(this, resourceMaker.getLangMapper());

        if (config.widget) {
            this.filesIdArray = IDArrayMake(config.widget.name)
            this.idStartName = config.widget.name
        } else {
            this.filesIdArray = IDArrayMake("R")
        }
        this.files = []
    }
    getIdStartName(): string {return this.idStartName}
    pushBinging(autoBindings: AutoBinding) {
        this.autoBinds.push(autoBindings)
    }

    storeBindings() {

        if (!this.config.output?.id) return
        if (!this.isPrimary()) return;

        const dirPath = path.dirname(this.config.output?.id!);
        const bindingsPath = path.join(dirPath, "bind.ts");


        let out = `import {View} from "@casperui/core/view/View";\nimport {${this.idStartName}} from "./R";\nimport {Context} from "@casperui/core/content/Context";\n`
        for (const autoBind of this.autoBinds) {
            out += autoBind.getAutoBindScript() + "\n"
        }
        out += "export type LayoutBindMap = {"
        for (const autoBind of this.autoBinds) {
            out += autoBind.getAutoBindMap() + "\n"
        }
        out += "};";
        out = this.storeBindSwitch(out)
        out += `
        
export function inflateBind<L extends keyof LayoutBindMap>(
    ctx: Context,
    layout: L,
    cache?: boolean, root?: View | null, rootNodeReplace?: boolean
): LayoutBindMap[L] {
    let v = ctx.getInflater().inflate(layout as any, cache, root, rootNodeReplace) as any
    return bindById(layout, v) as any;
}
        `;
        fs.writeFileSync(bindingsPath, out)
    }

    storeBindSwitch(out: string): string {
        out += `function bindById(id:number,view:View):any {\nswitch (id){`
        for (const autoBind of this.autoBinds) {
            out += `case ${autoBind.getID()}:return ${autoBind.getFunctionName()}(view);\n`
        }
        out += "}}";
        return out
    }

    getIdFilePath(): string | undefined {
        return this.config.output?.id
    }

    getVarIdMapper(): IDMapper {
        return this.variableIdMapper
    }

    isPrimary(): boolean {
        return this.config.isPrimaryResource
    }

    createFileID(isJs:boolean = false) {

        return this.createIDObject(this.filesIdArray,isJs)
    }

    createIDArray() {
        return this.variableIdMapper.toStringMap()
    }

    createLangIDArray() {
        return this.languageResource.toStringMap()
    }


    createIDObject(dirId: FilesIDArray,isJs:boolean = false, level = 0): string {
        let out = `${dirId.name}:{\n`
        if (level === 0) {
            out = `export const ${dirId.name} = {\n${this.createIDArray()},\n${this.languageResource.toStringMap()},\n`
        }

        for (const ch of dirId.child) {
            if (ch.fieldId !== -1) {
                out += `\t${ch.name}:${ch.fieldId},\n`
            } else {
                out += `${this.createIDObject(ch,isJs, level + 1)},\n`
            }
        }
        out += "\n}"
        if (level === 0 && !isJs) {
            out += " as const;"
        }
        return out
    }

    makeIDFile() {
        if (this.config.output?.id) {
            let isJS = false
            let path = this.config.output.id!
            if (!this.isPrimary()){
                isJS = true
                path = this.config.widget?.id!

            }
            fs.writeFileSync(path, this.createFileID(isJS))
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
                        if (!entry.name.endsWith(".css") && !entry.name.endsWith(".tsv")) {
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

