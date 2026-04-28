import {Dictionary, TREE_DIRECTION, DYNAMIC_TYPE} from "./Dictionary.js";
import {xml2Tree, XNode} from "../xml/XMLTree";
import {minifyCSS} from "@rMaker/utils/css";
import {SimpleHTMLParser} from "../xml/SimpleHTMLParser";
import {transformTextNodes} from "@rMaker/xml/UpdateTree";
import {Resource} from "@rMaker/resources/Resource";
import {bakePathTree, checkIdentifier, convertTagToLowerCase} from "@rMaker/utils/utils";
import {IDMapper} from "@rMaker/resources/IDMapper";
import {AutoBinding} from "@rMaker/binder/AutoBinding";
import {parseTemplate} from "@rMaker/xml/var";
import {DictionaryCodegen} from "@rMaker/bxml/DictionaryCodegen";

const RESERVED = new Set([
    "c", "i", "l", "t", "do", "if", "in", "as", "of", "for", "let", "new", "try", "var",
    "case", "else", "enum", "null", "this", "true", "void", "with",
    "await", "break", "catch", "class", "const", "false", "super",
    "throw", "while", "yield", "delete", "export", "import", "return",
    "static", "switch", "typeof", "default", "extends", "finally",
    "function", "interface", "continue", "instanceof", "implements"
])

function mapToObject(node: Map<string, string>): any {
    let ret = [] as string[];

    node.forEach((value, key, map) => {
        ret.push(`${key}:${value}`)
    })
    return `{${ret.join(",\n")}}`
}

export class CasperCodegen {
    private selfDictionary: DictionaryCodegen
    private autoBinds: AutoBinding
    private varIdMapper: IDMapper

    static html2XNode(fileData: string) {
        let parser = new SimpleHTMLParser(fileData)
        let node = xml2Tree(parser)
        node.childNodes = transformTextNodes(node.childNodes)
    }

    constructor(private fileName: string, private res: Resource) {
        this.selfDictionary = new DictionaryCodegen("xml")
        this.varIdMapper = res.getVarIdMapper()

        this.autoBinds = new AutoBinding(this.fileName, res.getIdStartName())
        res.pushBinging(this.autoBinds)
    }

    getBindings(): AutoBinding {
        return this.autoBinds
    }


    html2CaperBinary(fileData: string, fileName: string) {
        this.fileName = fileName
        let parser = new SimpleHTMLParser(fileData)
        let node = xml2Tree(parser)
        node.childNodes = transformTextNodes(node.childNodes)
        bakePathTree(node)
        let idMap = new Map<string, string>();


        if (fileName.includes("calendar.html")) {
            console.log("asd")
        }
        this.startProcess(node,"layout")

        let code = this.constVarsLines.join("\n") + "\n" + this.codeLines.join("\n")
        if (fileName.includes("calendar.html")) {
            console.log("asd")
        }
        return this.selfDictionary.createIndexedBuffer()
    }


    private varIndex = 0

    private nextVar(): string {
        let name: string
        do {
            let n = ""
            let x = ++this.varIndex
            while (x > 0) {
                x--
                n = String.fromCharCode(97 + (x % 26)) + n
                x = Math.floor(x / 26)
            }
            name = n
        } while (RESERVED.has(name))
        return name
    }


    constVars = new Map<string, string>();
    constVarsLines: string[] = []
    codeLines: string[] = []
    attrIndex = -1


    getTagVariable(tag: string): string {

        if (tag === "template") tag = "div"
        if (!this.constVars.has(tag)) {
            let varName = this.nextVar()
            this.constVars.set(tag, varName)
            this.constVarsLines.push(`let ${varName}="${tag}"`)
        }
        return this.constVars.get(tag)!
    }

    startProcess(node: XNode,functionName:string) {
        let tag = convertTagToLowerCase(node.tag)


        const rootVar = this.nextVar()

        // сохраняем текущий контекст
        const savedLines = this.codeLines
        const savedVarIndex = this.varIndex
        this.codeLines = []

        let div = this.getTagVariable(tag)

        this.codeLines.push(`let ${rootVar}=c(${div},0)`)

        let funIdMap = new Map<string, string>();
        funIdMap.set("root",rootVar)
        let child = []

        // this.processElement(node, rootVar, tag, funIdMap)

        for (let i = 0; i < node.childNodes.length; i++) {
            let o = this.processElement(node.childNodes[i], rootVar, tag, funIdMap)
            if (o) child.push(o)
        }

        if (child.length > 0) {
            this.codeLines.push(`${rootVar}.x([${child.join(",")}])`)
        }
        const fnBody = this.codeLines.join("\n")

        this.codeLines = savedLines
        this.codeLines.push(`let ${functionName}=function(){\n${fnBody}\nreturn ${mapToObject(funIdMap)}\n}`)

        return functionName
    }
    processElement(node: XNode, parent?: string, parentTag?: string, idMap: Map<string, string>): string | null {
        parentTag = parentTag === undefined ? "" : parentTag


        let tag = convertTagToLowerCase(node.tag)





        if (tag === "#text") {

            let content = node.textContent
            if (parentTag === "style") {
                content = minifyCSS(content)
            }

            // this.selfDictionary.writeTag(tagIndex)
            // this.selfDictionary.writeAttributesLengthAndDirection(1, direct)

            let value;
            if (!content) {
                content = ""
            }

            if (node.type) {
                if (node.type === DYNAMIC_TYPE.IDENTIFIER) {
                    let viewVariableName = this.nextVar()
                    idMap.set(node.textContent, viewVariableName)
                    this.codeLines.push(`let ${viewVariableName} = i()`)
                    return viewVariableName
                } else if (node.type === DYNAMIC_TYPE.LANG_ID) {
                    let indexOfVariable = this.res.languageResource.getIdByName(content)
                    return `l(${indexOfVariable})`
                }
            } else {
                value = this.selfDictionary.value(content)
            }

            // this.selfDictionary.writeAttribute(key, value)
            return `t(${this.attrIndex})`
        }

        let tagVariable = this.getTagVariable(tag)
        this.attrIndex++
        this.selfDictionary.writeAttributesLength(Object.keys(node.attrs).length)


        let isId = false
        let viewVariableName = ""
        for (const aKey in node.attrs) {
            let key = this.selfDictionary.key(aKey)
            let value = 0
            if (aKey === "id") {
                if (!checkIdentifier(node.attrs[aKey])) {
                    throw Error(`Invalid identifier [${aKey}="${node.attrs[aKey]}"] allow only(A-z 0-9 and _) \n    at (${this.fileName}:${node.line}:0)`)
                }
                viewVariableName = this.nextVar()
                idMap.set(node.attrs[aKey], viewVariableName)
                isId = true
                const path = node.__path!;
                let indexOfVariable = this.varIdMapper.getIdByName(node.attrs[aKey])

                this.autoBinds.addSelectByIdPath(node.attrs[aKey], path, "View", indexOfVariable);
                value = this.selfDictionary.valueTyped(DYNAMIC_TYPE.IDENTIFIER, indexOfVariable)
            } else {
                let valueString = node.attrs[aKey]
                const parsed = parseTemplate(valueString)[0];

                if (parsed.type == "lang") {
                    let indexOfVariable = this.res.languageResource.getIdByName(parsed.key)
                    value = this.selfDictionary.valueTyped(DYNAMIC_TYPE.LANG_ID, indexOfVariable)
                } else {
                    value = this.selfDictionary.value(node.attrs[aKey])
                }
            }
            this.selfDictionary.writeAttribute(key!, value)
        }


        if (tag === "template") {


            return this.startProcess(node,viewVariableName)
        }

        if (isId) {

            this.codeLines.push(`let ${viewVariableName}=c(${tagVariable},${this.attrIndex})`)
            let child = []
            for (let i = 0; i < node.childNodes.length; i++) {
                let o = this.processElement(node.childNodes[i], viewVariableName, tag, idMap)
                if (o)
                    child.push(o);
            }

            if (child.length > 0) {
                this.codeLines.push(`${viewVariableName}.x([${child.join(",")}])`)
            }

            return viewVariableName
        } else {

            let child = []
            for (let i = 0; i < node.childNodes.length; i++) {
                let o = this.processElement(node.childNodes[i], "", tag, idMap)
                if (o) child.push(o);

            }

            if (child.length > 0) {
                return `c(${tagVariable},${this.attrIndex}).x([${child.join(",")}])`
            }

            return `c(${tagVariable},${this.attrIndex})`
        }

    }
}

