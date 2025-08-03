import {BXNode} from "@casperui/core/utils/bxml/BXNode";
import {ByteBuffer} from "@casperui/core/io/ByteBuffer";

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
    LANG_ID       : 7,
}
const TYPE_MASK = 0xFF_FF_D9_FF
export class BXMLParser {
    private data:ByteBuffer
    private mTags:Array<string>
    private mKeys:Array<string>
    private mValues:Array<string|number>

    private mRoot:BXNode = { tag: "root", isText: false, children: [], attrs: {} };

    private offset = 0


    constructor(data:ByteBuffer) {
        this.data = data
        this.initBXMLParser()
    }
    initBXMLParser(){
        const data = this.data

        data.setPosition(3)

        let tagSize = data.readIndex()
        let keySize = data.readIndex()
        let valueSize = data.readIndex()
        let size = 0


        this.mTags = new Array(tagSize)
        this.mKeys = new Array(keySize)
        this.mValues = new Array(valueSize)
        for (let i = 0; i < tagSize; i++) {
            this.mTags[i] = data.readVarIntString()
        }
        for (let i = 0; i < keySize; i++) {
            this.mKeys[i] = data.readVarIntString()
        }
        for (let i = 0; i < valueSize; i++) {
            size = data.readIndex()
            let type = data.get(data.offset)
            if (type < 8) {
                if (type === DYNAMIC_TYPE.IDENTIFIER) {
                    data.inc()
                    this.mValues[i] = data.read16BE()
                }else if (type === DYNAMIC_TYPE.LANG_ID) {
                    data.inc()
                    this.mValues[i] = data.read16BE()
                }
            }else{
                this.mValues[i] = data.readString(size)
            }
        }
        this.mTags[0] ="#t"


        this.offset = data.position()
    }
    readTree() {
        this.data.setPosition(this.offset)
        this.startReadTag(this.mRoot)
        return this.mRoot.children[0]
    }
    startReadTag(node:BXNode,depth = 1){
        if (!this.data.hasRemaining()){
            return false
        }

        const tree = this.data

        while (tree.hasRemaining()){
            let tagIndex = this.data.readIndex()
            let tag = this.mTags[tagIndex]
            let atrAndDir = tree.read8BE()
            const dir = atrAndDir & 0xC0
            const attributeSize = atrAndDir & 0x3f
            let child = {tag:tag,isText:tagIndex === 0,attrs:null,children:[]} as BXNode

            node.children.push(child)
            if (attributeSize > 0) {
                child.attrs = {}
                for (let i = 0; i < attributeSize; i++) {
                    let name = this.mKeys[this.data.readIndex()]
                    child.attrs[name] = this.mValues[this.data.readIndex()]
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

