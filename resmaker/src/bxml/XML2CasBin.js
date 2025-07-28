const {Dictionary, TDIR, DYNAMIC_TYPE} = require("./Dictionary");
const {HTMLParser} = require("../xml/HTMLParser");
const {xml2Tree} = require("../xml/XMLTree");
const {minifyCSS} = require("./utils/css");
const htmlTagsMap = new Map([
    ["a", true], ["abbr", true], ["address", true], ["area", true], ["article", true], ["aside", true], ["audio", true],
    ["b", true], ["base", true], ["bdi", true], ["bdo", true], ["blockquote", true], ["body", true], ["br", true], ["button", true],
    ["canvas", true], ["caption", true], ["cite", true], ["code", true], ["col", true], ["colgroup", true], ["data", true], ["datalist", true], ["dd", true], ["del", true], ["details", true], ["dfn", true], ["dialog", true], ["div", true], ["dl", true], ["dt", true],
    ["em", true], ["embed", true],
    ["fieldset", true], ["figcaption", true], ["figure", true], ["footer", true], ["form", true],
    ["h1", true], ["h2", true], ["h3", true], ["h4", true], ["h5", true], ["h6", true], ["head", true], ["header", true], ["hgroup", true], ["hr", true], ["html", true],
    ["i", true], ["iframe", true], ["img", true], ["input", true], ["ins", true],
    ["kbd", true], ["keygen", true],
    ["label", true], ["legend", true], ["li", true], ["link", true],
    ["main", true], ["map", true], ["mark", true], ["menu", true], ["menuitem", true], ["meta", true], ["meter", true],
    ["nav", true], ["noscript", true],
    ["object", true], ["ol", true], ["optgroup", true], ["option", true], ["output", true],
    ["p", true], ["param", true], ["picture", true], ["pre", true], ["progress", true],
    ["q", true],
    ["rp", true], ["rt", true], ["ruby", true],
    ["s", true], ["samp", true], ["script", true], ["section", true], ["select", true], ["small", true], ["source", true], ["span", true], ["strong", true], ["style", true], ["sub", true], ["summary", true], ["sup", true],
    ["table", true], ["tbody", true], ["td", true], ["template", true], ["textarea", true], ["tfoot", true], ["th", true], ["thead", true], ["time", true], ["title", true], ["tr", true], ["track", true],
    ["u", true], ["ul", true],
    ["var", true], ["video", true],
    ["wbr", true]
]);

function convertTagToLowerCase(tag) {
    const lowerCaseTag = tag.toLowerCase();
    if (htmlTagsMap.has(lowerCaseTag)) {
        return lowerCaseTag;
    }
    return tag;
}
const identifier_rx = /^[A-Za-z_][A-Za-z0-9_]*$/
function checkIdentifier(name) {
    if (name.length === 0){
        return false;
    }
    return identifier_rx.test(name)
}


class XML2CasBin {
    constructor(extension,resourceConstID) {
        this.extension = extension;
        this.resourceConstID = resourceConstID;
        this.dictatory = new Dictionary(extension)
        this.fileName = ""
    }

    html2CaperBinary(fileData,fileName){
        this.fileName = fileName
        let parser = new HTMLParser()
        parser.mInput = fileData
        let node = xml2Tree(parser)
        this.processElement(node)
        return this.dictatory.createIndexedBuffer()
    }


    processElement(node,isLastChild,parentTag){
        isLastChild = isLastChild === undefined ?true:isLastChild
        parentTag = parentTag === undefined ?"":parentTag


        let tag= convertTagToLowerCase(node.tag)
        let tagIndex = this.dictatory.tag(tag)
        let direct;
        if (node.childNodes.length === 0){
            if (isLastChild){
                direct = TDIR.BACK
            }else{
                direct = TDIR.LINE
            }
        }else{
            if (isLastChild){
                direct = TDIR.INSIDE_BACK
            }else{
                direct = TDIR.INSIDE_LINE
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

            let value;
            let isTextWithId = false
            if (!content){
                content = ""
            }
            if (content.startsWith("{{")){
                let group = /\{\{(.*?)\}\}/.exec(content)
                if (group.length>=1){
                    let id = group[1]
                    let indexOfVariable = this.resourceConstID.getIdByName(id)
                    value = this.dictatory.valueTyped(DYNAMIC_TYPE.IDENTIFIER,indexOfVariable)
                    isTextWithId = true
                }
            }
            if (!isTextWithId){
                value = this.dictatory.value(content)
            }

            this.dictatory.writeAttribute(key,value)
            return
        }

        this.dictatory.writeTag(tagIndex)
        this.dictatory.writeAttributesLengthAndDirection(Object.keys(node.attrs).length,direct)

        for (const aKey in node.attrs) {
            let key = this.dictatory.key(aKey)
            let value = 0
            if (aKey === "id"){
                if (!checkIdentifier(node.attrs[aKey])){
                    throw Error(`Invalid identifier [${aKey}="${node.attrs[aKey]}"] allow only(A-z 0-9 and _) \n    at (${this.fileName}:${node.line}:0)`)
                }
                let indexOfVariable = this.resourceConstID.getIdByName(node.attrs[aKey])
                value = this.dictatory.valueTyped(DYNAMIC_TYPE.IDENTIFIER,indexOfVariable)
            }else{
                value = this.dictatory.value(node.attrs[aKey])
            }

            this.dictatory.writeAttribute(key,value)
        }


        for (let i = 0; i < node.childNodes.length; i++) {
            this.processElement(node.childNodes[i],i === node.childNodes.length-1,tag);
        }

    }
}

module.exports.XML2CasBin = XML2CasBin;