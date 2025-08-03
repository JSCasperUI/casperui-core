import {Resource} from "@rMaker/resources/Resource";
import {IDMapper} from "@rMaker/resources/IDMapper";
import path from "path";
import {parseTsv} from "@rMaker/utils/tsv";
import fs from "fs";
import {ByteBufferOutput} from "@rMaker/io/ByteBufferOutput";

function getFileNameWithoutExtension(filePath: string): string {
    return path.parse(filePath).name;
}

interface StringRegistry {
    path: string;
    table: Record<string, string>[];
}

interface IndexedLang {
    index: number,
    value: Record<string, string>
}

export class StringPool {
    private list: StringRegistry[] = []
    private defaultLanguage: string = "en";
    private languages = new Set<string>();
    private selfIdList: string[] = [];

    private allStrings: IndexedLang[] = []


    constructor(public res: Resource, public publicLangMapper: IDMapper) {
    }

    static compileStrings(stringList: StringPool[]) {
        let primaryLang = ""
        let langSet = new Set<string>();
        let allCount = 0
        for (const o of stringList) {
            if (o.isPrimaryStrings()) {
                primaryLang = o.defaultLanguage
            }
            allCount += o.allStrings.length
            o.getLangList().map(lang => {
                langSet.add(lang);
            });
        }
        let langList = [
            primaryLang,
            ...[...langSet].filter(lang => lang !== primaryLang)
        ];

        let resultStrings = new Array(allCount)
        for (const o of stringList) {
            for (let i = 0; i < o.allStrings.length; i++) {
                let itm = o.allStrings[i]
                resultStrings[itm.index] = itm.value
            }
        }




        const langLength = langList.length
        let final = new ByteBufferOutput()
        let stringSizeBuffer = new ByteBufferOutput(2 * langList.length * allCount)
        let stringBuffer = new ByteBufferOutput(10 * langList.length * allCount)
        for (let i = 0; i < allCount; i++) {
            let line = resultStrings[i]
            for (let j = 0; j < langLength; j++) {
                let key = langList[j]
                let value = line[key]
                if (value === undefined) {
                    stringSizeBuffer.uint16(0)
                } else {
                    let str = Buffer.from(value, "utf-8")
                    stringSizeBuffer.uint16(value.length)
                    stringBuffer.writeBytes(str)
                }
            }
        }

        final.uint8(langList.length)
        for (let i = 0; i < langList.length; i++) {
            final.uint8(langList[i].length)
            final.writeBytes(langList[i])
        }
        final.uint32(allCount)
        let strings = stringBuffer.toByteArray()
        let sizes = stringSizeBuffer.toByteArray()
        final.uint32(strings.length)
        final.writeBytes(strings)
        final.writeBytes(sizes)

        return final.toByteArray()


    }

    isPrimaryStrings(): boolean {
        return this.res.isPrimary()
    }

    toStringMap(): string {
        let out = []
        for (let i = 0; i < this.selfIdList.length; i++) {
            let key = this.selfIdList[i]
            let id = this.publicLangMapper.getIdByName(key)
            out.push(`  ${key}: ${id}`)
        }
        return `lang: {\n${out.join(",\n")}\n}`;
    }

    appendMissingFiled(missing: string) {
        if (this.list.length > 0) {
            let obj = {} as any
            let lang_list = this.getLangList()
            let line = []
            for (let j = 0; j < this.languages.size + 1; j++) {
                if (j == 0) {
                    obj.id = missing
                    line.push(missing)
                } else {
                    obj[lang_list[j]] = `${missing}_ph`
                    line.push(`${missing}_ph`)
                }
            }
            fs.appendFileSync(this.list[0].path,"\n"+ line.join("\t"));
            return obj;
        }
        return null
    }

    getIdByName(name: string): number {

        if (!this.publicLangMapper.has(name)) {
            let output = this.appendMissingFiled(name);
            if (output) {
                let index = this.publicLangMapper.getIdByName(name);
                this.allStrings.push({
                    index: index,
                    value: output
                })
                this.selfIdList.push(name)
                return index
            }


        }
        return this.publicLangMapper.getIdByName(name);
    }


    getLangList(): string[] {
        return [
            this.defaultLanguage,
            ...[...this.languages].filter(lang => lang !== this.defaultLanguage)
        ];
    }


    findResFile() {
        const keep: string[] = [];
        for (const file of this.res.files) {
            if (file.toLowerCase().endsWith(".tsv")) {
                let item = {
                    path: file
                } as StringRegistry;
                this.readResource(item);
                this.list.push(item);
            } else {
                keep.push(file);
            }
        }
        this.res.files = keep;
    }

    private readResource(item: StringRegistry) {
        let tsv = parseTsv(fs.readFileSync(item.path, "utf8"))
        tsv.languages.map(itm => this.languages.add(itm.toLocaleLowerCase()));

        if (this.defaultLanguage.length === 0) {
            this.defaultLanguage = tsv.languages[0]
        }


        for (let i = 0; i < tsv.table.length; i++) {
            const tableElement = tsv.table[i]
            let index = this.publicLangMapper.getIdByName(tableElement.id)
            this.selfIdList.push(tableElement.id)
            this.allStrings.push({
                index: index,
                value: tableElement
            })
        }
    }
}