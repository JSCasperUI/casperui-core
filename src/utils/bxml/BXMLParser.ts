import {ByteBufferOffset} from "@casperui/core/io/ByteBufferOffset";
import {BXNode} from "@casperui/core/utils/bxml/BXNode";

const DIR_LINE = 0x00
const DIR_INSIDE_LINE = 0x40
const DIR_INSIDE_BACK = 0x80
const DIR_BACK = 0xC0

const DYNAMIC_TYPE = {
    MIN     : 15,
    IDENTIFIER     : 16,
    UINT_16        : 17,
    FLOAT_64       : 18,
    UINT_32        : 19,
    UINT_64        : 21,
    FLOAT_32       : 22,
    SVG_PATH       : 23,
    EXTENSION      : 24,
    MAX:25
}

export class BXMLParser {
    private data:ByteBufferOffset
    private tree:ByteBufferOffset
    private tags:Array<string>
    private keys:Array<string>
    private values:Array<string|number>
    private root:BXNode = { tag: "root", isText: false, children: [], attrs: {} };


    constructor(data:ByteBufferOffset) {
        this.data = data
        this.tags = []
        this.keys = []
        this.values = []
        this.tree = undefined
        this.init()
    }
    init(){

        this.data.setPosition(5)

        let tagSize = this.data.readIndex()
        let keySize = this.data.readIndex()
        let valueSize = this.data.readIndex()
        let size = 0

        for (let i = 0; i < tagSize; i++) {
            size = this.data.readIndex()
            this.tags.push(this.data.readString(size))
        }
        for (let i = 0; i < keySize; i++) {
            size = this.data.readIndex()
            this.keys.push(this.data.readString(size))
        }
        for (let i = 0; i < valueSize; i++) {
            size = this.data.readIndex()
            let type = this.data.get(this.data.pos)
            if (type > DYNAMIC_TYPE.MIN && type < DYNAMIC_TYPE.MAX) {
                if (type === DYNAMIC_TYPE.IDENTIFIER) {
                    this.data.positionOffset(1)
                    this.values.push(this.data.read16BE())
                }
            }else{
                this.values.push(this.data.readString(size))
            }

        }

        let headerOffset = this.data.position()
        this.tree = new ByteBufferOffset(this.data, headerOffset, this.data.size - (headerOffset))
    }
    parse() {
        this.startReadTag(this.root)
        return this.root.children[0]
    }
    startReadTag(node:BXNode,depth = 1){
        if (!this.tree.hasRemaining()){
            return false
        }

        while (this.tree.hasRemaining()){
            let tagIndex = this.tree.readIndex()
            let isTextNode = tagIndex === 0
            let tag = this.tags[tagIndex]
            let child = {tag:tag,isText:isTextNode,attrs:null,children:[]} as BXNode
            let atrAndDir = this.tree.read8BE()
            let dir = atrAndDir & 0xC0
            let attributeSize = atrAndDir & 0x3f
            node.children.push(child)
            if (attributeSize > 0) {
                child.attrs = {}
                for (let i = 0; i < attributeSize; i++) {
                    let name = this.keys[this.tree.readIndex()]
                    child.attrs[name] = this.values[this.tree.readIndex()]
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

