const {EOF, ELEMENT} = require("./NextParser");

function xml2TreeContent(xmlParser,node,depth = 0){
    var status = 0

    if (xmlParser.getDepth() === 0){
        xmlParser.next()
    }
    let xmlNode = xmlParser.getFullTag()
    let content = xmlNode.content
    let child = {tag:xmlNode.name,isText:false,textContent:content,attrs:[],childNodes:[],line:xmlNode.line}
    if (xmlNode.attributes.length>0){
        child.attrs = {}
        for (const attribute of xmlNode.attributes) {
            child.attrs[attribute.name] = attribute.value
        }
    }



    if (node!=null && content.length===0){
        node.childNodes.push(child)

    }else {
        if (content.length!==0){
            node.isText = true
            node.textContent = content
        }

        node = child
    }
    while ((status = xmlParser.next()) !== EOF && xmlParser.getDepth() > depth){
        if (status !== ELEMENT){
            continue
        }
        if (status === ELEMENT){
            xml2TreeContent(xmlParser,child,depth + 1)
        }else{
            break
        }

    }


    return node
}
module.exports.xml2TreeContent = xml2TreeContent
