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

        this.mData.setPosition(3)

        let tagSize = this.mData.readIndex()
        let keySize = this.mData.readIndex()
        let valueSize = this.mData.readIndex()
        let size = 0

        for (let i = 0; i < tagSize; i++) {
            size = this.mData.readIndex()
            this.mTags.push(this.mData.readString(size))
        }
        for (let i = 0; i < keySize; i++) {
            size = this.mData.readIndex()
            this.mKeys.push(this.mData.readString(size))
        }
        for (let i = 0; i < valueSize; i++) {
            size = this.mData.readIndex()
            let type = this.mData.get(this.mData.pos)
            if (type < 8) {
                if (type === DYNAMIC_TYPE.IDENTIFIER) {
                    this.mData.positionOffset(1)
                    this.mValues.push(this.mData.read16BE())
                }
            }else{
                this.mValues.push(this.mData.readString(size))
            }
        }
        let headerOffset = this.mData.position()
        this.mTree = new ByteBufferOffset(this.mData, headerOffset, this.mData.size - (headerOffset))
    }
    readTree() {
        this.startReadTag(this.mRoot)
        return this.mRoot.children[0]
    }
    startReadTag(node:BXNode,depth = 1){
        if (!this.mTree.hasRemaining()){
            return false
        }

        while (this.mTree.hasRemaining()){
            let tagIndex = this.mTree.readIndex()
            let isTextNode = tagIndex === 0
            let tag = this.mTags[tagIndex]
            let child = {tag:tag,isText:isTextNode,attrs:null,children:[]} as BXNode
            let atrAndDir = this.mTree.read8BE()
            let dir = atrAndDir & 0xC0
            let attributeSize = atrAndDir & 0x3f
            node.children.push(child)
            if (attributeSize > 0) {
                child.attrs = {}
                for (let i = 0; i < attributeSize; i++) {
                    let name = this.mKeys[this.mTree.readIndex()]
                    child.attrs[name] = this.mValues[this.mTree.readIndex()]
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

