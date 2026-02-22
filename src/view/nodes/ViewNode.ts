import {NodeType} from "@casperui/core/view/nodes/NodeType";
import {ELEMENT_SVG_URI, TAG_SCRIPT, TAG_STYLE, TAG_SVG} from "@casperui/core/space/Constants";
import {View} from "@casperui/core/view/View";

export class ViewNode {
    mType: NodeType
    mNode: Node
    static WIDGET_TAG = "WTAG"

    protected id: number = -1

    setID(n: number) {
        this.id  = n
    }

    constructor(type: NodeType | string, content?: string) {
        this.mType = NodeType.ELEMENT;
        if (typeof type === "string") {
            if (type.startsWith("#") && type === "#t") {
                this.mNode = document.createTextNode("");
            } else {
                if (type === View.WIDGET_TAG) {

                } else {
                    this.mNode = document.createElement(type);
                }
            }
        } else {
            this.mType = type;
            switch (type) {
                case NodeType.TEXT: {
                    this.mNode = document.createTextNode(content)
                    break
                }
                case NodeType.STYLE: {
                    this.mNode = document.createElement(TAG_STYLE);
                    (this.mNode as HTMLElement).textContent = content
                    break
                }
                case NodeType.SCRIPT: {
                    this.mNode = document.createElement(TAG_SCRIPT);
                    (this.mNode as HTMLElement).textContent = content
                    break
                }
                case NodeType.SVG: {
                    this.mNode = document.createElementNS(ELEMENT_SVG_URI, TAG_SVG);
                    (this.mNode as SVGSVGElement).innerHTML = content
                    break
                }
            }
        }
    }

    getNode(): Node {
        return this.mNode
    }

    getElement(): HTMLElement {
        return this.mNode as HTMLElement
    }
}

