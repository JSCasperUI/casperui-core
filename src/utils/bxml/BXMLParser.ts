import {ByteBufferOffset} from "@casperui/core/io/ByteBufferOffset";
import {BXNode} from "@casperui/core/utils/bxml/BXNode";

const DIR_LINE = 0x00
const DIR_INSIDE_LINE = 0x40
const DIR_INSIDE_BACK = 0x80
const DIR_BACK = 0xC0

const DYNAMIC_TYPE = {
    UINT_16       : 0,
    UINT_32       : 1,
    UINT_64       : 2,
    FLOAT_32      : 3,
    FLOAT_64      : 4,
    SVG_PATH      : 5,
    IDENTIFIER    : 6,
}
const TYPE_MASK = 0xFF_FF_D9_FF
export class BXMLParser {
    private mData:ByteBufferOffset
    private mTree:ByteBufferOffset
    private mTags:Array<string>
    private mKeys:Array<string>
    private mValues:Array<string|number>

    private mRoot:BXNode = { tag: "root", isText: false, children: [], attrs: {} };




    constructor(data:ByteBufferOffset) {
        this.mData = data
        this.mTags = []
        this.mKeys = []
        this.mValues = []
        this.mTree = undefined
        this.initBXMLParser()
    }
    initBXMLParser(){
        const data = this.mData

        data.setPosition(3)

        let tagSize = data.readIndex()
        let keySize = data.readIndex()
        let valueSize = data.readIndex()
        let size = 0


        this.mTags = new Array(tagSize)
        this.mKeys = new Array(keySize)
        this.mValues = new Array(valueSize)
        for (let i = 0; i < tagSize; i++) {
            size = data.readIndex()
            this.mTags[i] = data.readString(size)
        }
        for (let i = 0; i < keySize; i++) {
            size = data.readIndex()
            this.mKeys[i] = data.readString(size)
        }
        for (let i = 0; i < valueSize; i++) {
            size = data.readIndex()
            let type = data.get(data.pos)
            if (type < 8) {
                if (type === DYNAMIC_TYPE.IDENTIFIER) {
                    data.positionOffset(1)
                    this.mValues[i] = data.read16BE()
                }
            }else{
                this.mValues[i] = data.readString(size)
            }
        }
        let headerOffset = data.position()
        this.mTree = new ByteBufferOffset(data, headerOffset, data.size - (headerOffset))
    }
    readTree() {
        this.startReadTag(this.mRoot)
        return this.mRoot.children[0]
    }
    startReadTag(node:BXNode,depth = 1){
        if (!this.mTree.hasRemaining()){
            return false
        }

        const tree = this.mTree

        while (tree.hasRemaining()){
            let tagIndex = tree.readIndex()
            let isTextNode = tagIndex === 0
            let tag = this.mTags[tagIndex]
            let child = {tag:tag,isText:isTextNode,attrs:null,children:[]} as BXNode
            let atrAndDir = tree.read8BE()
            let dir = atrAndDir & 0xC0
            let attributeSize = atrAndDir & 0x3f
            node.children.push(child)
            if (attributeSize > 0) {
                child.attrs = {}
                for (let i = 0; i < attributeSize; i++) {
                    let name = this.mKeys[tree.readIndex()]
                    child.attrs[name] = this.mValues[tree.readIndex()]
                }
            }
            switch (dir) {
                case DIR_INSIDE_BACK:{
                    return this.startReadTag(child, depth + 1)
                }
                case DIR_BACK:{
                    return false
                }
                case DIR_INSIDE_LINE:{
                    let ld = depth + 1
                    while (this.startReadTag(child, ld)) {}
                }
            }
        }
        return true
    }
}

