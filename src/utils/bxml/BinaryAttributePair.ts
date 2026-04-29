import {ByteBuffer} from "@casperui/core/io/ByteBuffer";
import {Resources} from "@casperui/core/content/Resources";

const DYNAMIC_TYPE = {

    IDENTIFIER: 6,
    LANG_ID: 7,
}

export class BinaryAttributePair {
    private data: ByteBuffer
    private mKeys: Array<string>
    private mValues: Array<string | number>
    private attributesPairs: Record<string, string|number>[] = []

    constructor(data: ByteBuffer, private res: Resources) {
        this.data = data
        this.initBXMLParser()
    }
    getAttribute(index:number) {
        return this.attributesPairs[index];
    }
    getValue(index:number) {
        return this.mValues[index];
    }

    initBXMLParser() {
        const data = this.data

        data.setBufferPosition(3)

        let keySize = data.readIndex()
        let valueSize = data.readIndex()
        let size = 0


        this.mKeys = new Array(keySize)
        this.mValues = new Array(valueSize)

        for (let i = 0; i < keySize; i++) {
            this.mKeys[i] = data.readVarIntString()
        }
        for (let i = 0; i < valueSize; i++) {
            size = data.readIndex()
            let type = data.getByIndex(data.getBufferPosition())
            if (type < 8) {
                if (type === DYNAMIC_TYPE.IDENTIFIER) {
                    data.inc()
                    this.mValues[i] = data.read16BE()
                } else if (type === DYNAMIC_TYPE.LANG_ID) {
                    data.inc()
                    this.mValues[i] = this.res.getString(data.read16BE())
                }
            } else {
                this.mValues[i] = data.readString(size)
            }
        }

        this.data.setBufferPosition( data.getBufferPosition())
        this.readAttrs()
    }

    readAttrs() {
        if (!this.data.hasRemaining()) {
            return false
        }

        const tree = this.data

        while (tree.hasRemaining()) {
            let attrCount = this.data.readIndex()
            let attrs = {}
            for (let i = 0; i < attrCount; i++) {
                let name = this.mKeys[this.data.readIndex()]
                attrs[name] = this.mValues[this.data.readIndex()]
            }
            this.attributesPairs.push(attrs)
        }
        return true
    }
}

