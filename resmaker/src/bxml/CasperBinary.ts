import {Dictionary, TREE_DIRECTION, DYNAMIC_TYPE} from "./Dictionary.js";
import {xml2Tree, XNode} from "../xml/XMLTree";
import {minifyCSS} from "@rMaker/utils/css";
import {SimpleHTMLParser} from "../xml/SimpleHTMLParser";
import {transformTextNodes} from "@rMaker/xml/UpdateTree";
import {Resource} from "@rMaker/resources/Resource";
import {bakePathTree, checkIdentifier, convertTagToLowerCase} from "@rMaker/utils/utils";
import {IDMapper} from "@rMaker/resources/IDMapper";
import {AutoBinding} from "@rMaker/binder/AutoBinding";


export class CasperBinary {
    private selfDictionary: Dictionary
    private autoBinds: AutoBinding
    private varIdMapper: IDMapper

    constructor(private fileName: string, private res: Resource) {
        this.selfDictionary = new Dictionary("xml")
        this.varIdMapper = res.getVarIdMapper()

        this.autoBinds = new AutoBinding(this.fileName)
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
        this.processElement(node)
        return this.selfDictionary.createIndexedBuffer()
    }


    processElement(node: XNode, isLastChild?: boolean, parentTag?: string) {
        isLastChild = isLastChild === undefined ? true : isLastChild
        parentTag = parentTag === undefined ? "" : parentTag


        let tag = convertTagToLowerCase(node.tag)
        let tagIndex = this.selfDictionary.tag(tag)
        let direct;
        if (node.childNodes.length === 0) {
            if (isLastChild) {
                direct = TREE_DIRECTION.BACK
            } else {
                direct = TREE_DIRECTION.LINE
            }
        } else {
            if (isLastChild) {
                direct = TREE_DIRECTION.INSIDE_BACK
            } else {
                direct = TREE_DIRECTION.INSIDE_LINE
            }
        }

        if (tag === "#text") {

            let content = node.textContent
            if (parentTag === "style") {
                content = minifyCSS(content)
            }

            this.selfDictionary.writeTag(tagIndex)
            this.selfDictionary.writeAttributesLengthAndDirection(1, direct)
            let key = this.selfDictionary.key("#t") as number

            let value;
            if (!content) {
                content = ""
            }

            if (node.type) {
                if (node.type === DYNAMIC_TYPE.IDENTIFIER) {
                    key = this.selfDictionary.key("#i")!
                    let indexOfVariable = this.varIdMapper.getIdByName(content)
                    value = this.selfDictionary.valueTyped(DYNAMIC_TYPE.IDENTIFIER, indexOfVariable)
                    const path = node.__path!;
                    this.autoBinds.addSelectByIdPath(content, path);
                } else if (node.type === DYNAMIC_TYPE.LANG_ID) {
                    key = this.selfDictionary.key("#l")!
                    let indexOfVariable = this.res.languageResource.getIdByName(content)
                    value = this.selfDictionary.valueTyped(DYNAMIC_TYPE.LANG_ID, indexOfVariable)
                }
            } else {
                value = this.selfDictionary.value(content)
            }

            this.selfDictionary.writeAttribute(key, value)
            return
        }

        this.selfDictionary.writeTag(tagIndex)
        this.selfDictionary.writeAttributesLengthAndDirection(Object.keys(node.attrs).length, direct)

        for (const aKey in node.attrs) {
            let key = this.selfDictionary.key(aKey)
            let value = 0
            if (aKey === "id") {
                if (!checkIdentifier(node.attrs[aKey])) {
                    throw Error(`Invalid identifier [${aKey}="${node.attrs[aKey]}"] allow only(A-z 0-9 and _) \n    at (${this.fileName}:${node.line}:0)`)
                }
                const path = node.__path!;
                this.autoBinds.addSelectByIdPath(node.attrs[aKey], path);
                let indexOfVariable = this.varIdMapper.getIdByName(node.attrs[aKey])
                value = this.selfDictionary.valueTyped(DYNAMIC_TYPE.IDENTIFIER, indexOfVariable)
            } else {
                value = this.selfDictionary.value(node.attrs[aKey])
            }

            this.selfDictionary.writeAttribute(key!, value)
        }

        for (let i = 0; i < node.childNodes.length; i++) {
            this.processElement(node.childNodes[i], i === node.childNodes.length - 1, tag);
        }

    }
}

