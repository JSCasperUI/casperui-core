import {BXMLParser} from "@casperui/core/utils/bxml/BXMLParser";
import {Context} from "@casperui/core/content/Context";
import {BXNode} from "@casperui/core/utils/bxml/BXNode";
import {ELEMENT_SVG_URI, ELEMENT_SVG_XLINK_NS, TAG_SCRIPT, TAG_STYLE} from "@casperui/core/space/Constants";


export class BXMLSvgInflater {


    static inflate(id: number, context: Context): Element {
        let node = (new BXMLParser(context.getResources().getBufferById(id))).readTree()
        return BXMLSvgInflater.inflateChild(node, true)
    }


    static inflateChild(node: BXNode, isFirst: boolean = true): Element {

        const element = document.createElementNS(ELEMENT_SVG_URI, node.tag)

        for (const key in node.attrs) {
            const val = node.attrs[key];
            if (key === "xlink:href") {
                element.setAttributeNS(ELEMENT_SVG_XLINK_NS, key, val as string);
            } else {
                element.setAttribute(key, val as string);
            }
        }

        switch (node.tag) {
            case TAG_SCRIPT:
            case TAG_STYLE: {
                element.textContent = node.children[0].attrs["#t"] as string
                return element
            }
        }

        for (let i = 0; i < node.children.length; i++) {
            let result = this.inflateChild(node.children[i], false)
            if (result != null) {
                element.appendChild(result)
            }
        }


        return element
    }
}

