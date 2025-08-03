import {Dictionary, TREE_DIRECTION, DYNAMIC_TYPE} from "./Dictionary.js";
import {IDMapper} from "@rMaker/resources/IDMapper";
import {SimpleHTMLParser} from "@rMaker/xml/SimpleHTMLParser";
import {xml2Tree, XNode} from "@rMaker/xml/XMLTree";
import {minifyCSS} from "@rMaker/utils/css";
import {convertTagToLowerCase} from "@rMaker/utils/utils";



export class SVGBinarize {
    private dictatory: Dictionary;
    private fileName: string;
    constructor(private extension:string,private resourceConstID:IDMapper) {
        this.dictatory = new Dictionary(extension)
        this.fileName = ""
    }


    html2CaperBinary(fileData:string,fileName:string){
        this.fileName = fileName
        let parser = new SimpleHTMLParser(fileData)
        let node = xml2Tree(parser)
        this.processElement(node)
        return this.dictatory.createIndexedBuffer()
    }


    processElement(node:XNode,isLastChild?:boolean,parentTag?:string){
        isLastChild = isLastChild === undefined ?true:isLastChild
        parentTag = parentTag === undefined ?"":parentTag


        let tag= convertTagToLowerCase(node.tag)
        let tagIndex = this.dictatory.tag(tag)
        let direct;
        if (node.childNodes.length === 0){
            if (isLastChild){
                direct = TREE_DIRECTION.BACK
            }else{
                direct = TREE_DIRECTION.LINE
            }
        }else{
            if (isLastChild){
                direct = TREE_DIRECTION.INSIDE_BACK
            }else{
                direct = TREE_DIRECTION.INSIDE_LINE
            }
        }

        if (tag === "#text"){

            let content = node.textContent
            if (parentTag === "style"){
                content = minifyCSS(content)
            }

            this.dictatory.writeTag(tagIndex)
            this.dictatory.writeAttributesLengthAndDirection(1,direct)
            let key = this.dictatory.key("#t")
            let value = this.dictatory.value(content)

            this.dictatory.writeAttribute(key,value)
            return
        }

        this.dictatory.writeTag(tagIndex)
        this.dictatory.writeAttributesLengthAndDirection(Object.keys(node.attrs).length,direct)

        for (const aKey in node.attrs) {
            let key = this.dictatory.key(aKey)
            let value = this.dictatory.value(node.attrs[aKey])

            this.dictatory.writeAttribute(key,value)
        }


        for (let i = 0; i < node.childNodes.length; i++) {
            this.processElement(node.childNodes[i],i === node.childNodes.length-1,tag);
        }

    }
}

