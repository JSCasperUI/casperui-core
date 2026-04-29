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
import {Scope} from "@rMaker/bxml/Scope";

const RESERVED = new Set([
    "c", "i", "l", "t", "do", "if", "in", "as", "of", "for", "let", "new", "try", "var", "ctx",
    "case", "else", "enum", "null", "this", "true", "void", "with",
    "await", "break", "catch", "class", "const", "false", "super",
    "throw", "while", "yield", "delete", "export", "import", "return",
    "static", "switch", "typeof", "default", "extends", "finally",
    "function", "interface", "continue", "instanceof", "implements"
])


const codeStart = `

`

export class CasperCodegen {
    private selfDictionary: DictionaryCodegen
    private autoBinds: AutoBinding
    private varIdMapper: IDMapper

    constructor(private fileName: string, private res: Resource, private resourceId: number) {
        this.selfDictionary = new DictionaryCodegen("xml")
        this.varIdMapper = res.getVarIdMapper()

        this.autoBinds = new AutoBinding(this.fileName, res.getIdStartName())
        res.pushBinging(this.autoBinds)
    }

    getBindings(): AutoBinding {
        return this.autoBinds
    }

    ts = ""
    html2CaperBinary(fileData: string, fileName: string) {
        this.fileName = fileName
        let parser = new SimpleHTMLParser(fileData)
        let node = xml2Tree(parser)
        node.childNodes = transformTextNodes(node.childNodes)
        bakePathTree(node)

        if (fileName.includes("calendar.html")) {
            console.log("asd")
        }
        let scope = new Scope(this.autoBinds.getFunctionName())
        this.startProcess(node, scope)
        scope.setMainInterfaceName(this.autoBinds.getInterfaceName())


//         this.ts = `
// import {View} from "@casperui/core/view/View";
// import {Context} from "@casperui/core/content/Context";
// import {_getLayCTX} from "@casperui/core/utils/bxml/LayoutContext";\n`
        this.ts += scope.getInterfaceBody() + "\n"
        this.ts += scope.getMainCode(`ctx: Context`, `let [c, t, l, i] = _getLayCTX(ctx, ${this.resourceId});`)
        // let code = this.interfaces.join("\n") + this.constVarsLines.join("\n") + "\n" + this.codeLines.join("\n")
        if (fileName.includes("calendar.html")) {
            console.log("asd")
        }
        this.autoBinds.setCode(this.ts)
        return this.selfDictionary.createIndexedBuffer()
    }


    attrIndex = -1


    startProcess(node: XNode, scope: Scope, isTopLevel: boolean = false) {
        let tag = convertTagToLowerCase(node.tag)


        const rootVar = scope.nextVar()

        let div = scope.getTagVariable(tag)

        scope.addCode(`let ${rootVar}=c(${div},0)`)

        scope.setId("root", rootVar, "View")

        let child = []

        // this.processElement(node, rootVar, tag, funIdMap)

        for (let i = 0; i < node.childNodes.length; i++) {
            let o = this.processElement(node.childNodes[i], rootVar, tag, scope)
            if (o) child.push(o)
        }

        if (child.length > 0) {
            scope.addCode(`${rootVar}.x([${child.join(",")}])`)
        }

        return scope

    }

    processElement(node: XNode, parent: string | undefined, parentTag: string | undefined, scope: Scope): string | null {
        parentTag = parentTag === undefined ? "" : parentTag


        let tag = convertTagToLowerCase(node.tag)


        if (tag === "#text") {

            let content = node.textContent
            if (parentTag === "style") {
                content = minifyCSS(content)
            }

            let value;
            if (!content) content = ""

            if (node.type) {
                if (node.type === DYNAMIC_TYPE.IDENTIFIER) {
                    let viewVariableName = scope.nextVar()
                    scope.setId(node.textContent, viewVariableName)
                    scope.addCode(`let ${viewVariableName} = i()`)
                    return viewVariableName
                } else if (node.type === DYNAMIC_TYPE.LANG_ID) {
                    let indexOfVariable = this.res.languageResource.getIdByName(content)
                    return `l(${indexOfVariable})`
                }
            } else {
                value = this.selfDictionary.value(content)
            }

            // this.selfDictionary.writeAttribute(key, value)
            return `t(${value})`
        }

        let tagVariable = scope.getTagVariable(tag)
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
                viewVariableName = scope.nextVar()

                let idKey = node.attrs[aKey]
                if (tag === "template") {

                    scope.setId(idKey, viewVariableName, this.getBindings().getInterfaceName() + "_" + idKey)

                } else {
                    scope.setId(idKey, viewVariableName)

                }
                isId = true
                let indexOfVariable = this.varIdMapper.getIdByName(node.attrs[aKey])
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
            let childScope = this.startProcess(node, scope.getNextScope(viewVariableName))

            scope.addCode(childScope.makeCode())

            return null
        }

        if (isId) {
            scope.addCode(`let ${viewVariableName}=c(${tagVariable},${this.attrIndex})`)
            let child = []
            for (let i = 0; i < node.childNodes.length; i++) {
                let o = this.processElement(node.childNodes[i], viewVariableName, tag, scope)
                if (o)
                    child.push(o);
            }

            if (child.length > 0) {
                scope.addCode(`${viewVariableName}.x([${child.join(",")}])`)
            }

            return viewVariableName
        } else {
            let child = []
            for (let i = 0; i < node.childNodes.length; i++) {
                let o = this.processElement(node.childNodes[i], "", tag, scope)
                if (o) child.push(o);

            }

            if (child.length > 0) {
                return `c(${tagVariable},${this.attrIndex}).x([${child.join(",")}])`
            }

            return `c(${tagVariable},${this.attrIndex})`
        }

    }
}

