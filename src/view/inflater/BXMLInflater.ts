import {BXMLParser} from "@casperui/core/utils/bxml/BXMLParser";
import {Context} from "@casperui/core/content/Context";
import {BXNode} from "@casperui/core/utils/bxml/BXNode";
import {View} from "@casperui/core/view/View";
import {ViewNode} from "@casperui/core/view/nodes/ViewNode";
import {NodeType} from "@casperui/core/view/nodes/NodeType";
import {WidgetRegistrar} from "@casperui/core/view/inflater/WidgetRegistrar";
import {EMPTY_STRING, TAG_SCRIPT, TAG_STYLE, TAG_SVG} from "@casperui/core/space/Constants";


export class BXMLInflater {

    private cacheNodes: Record<number, BXNode>

    constructor(private context: Context) {
        this.cacheNodes = {}
    }


    inflate(id: number, cache: boolean = false, root: View | null = null, rootNodeReplace: boolean = false): View {
        let node: BXNode

        if (cache) {
            if (this.cacheNodes[id]) {
                node = this.cacheNodes[id]
            } else {
                node = (new BXMLParser(this.context.getResources().getBufferById(id))).readTree()
                this.cacheNodes[id] = node
            }
        } else {
            node = (new BXMLParser(this.context.getResources().getBufferById(id))).readTree()
        }
        let result = this.inflateChild(node) as View
        if (root) {
            if (rootNodeReplace) {
                root.mNode = result.mNode
                let children = result.getChildren()
                for (let i = 0; i < children.length; i++) {
                    root.addView(children[i])
                }
            } else {
                root.addView(result)
            }

        }
        return result as View
    }


    inflateChild(node: BXNode): ViewNode {
        if (node.isText) {
            if (node.attrs["#t"])
                return new ViewNode(NodeType.TEXT, node.attrs["#t"] as string);
            if (node.attrs["#i"] != undefined){
                let v = new ViewNode(NodeType.TEXT,EMPTY_STRING)
                v.setID(node.attrs["#i"] as number)
                return v
            }
            if (node.attrs["#l"] != undefined) {
                return new ViewNode(NodeType.TEXT, this.context.getResources().getString(node.attrs["#l"] as number));
            }
        }

        switch (node.tag) {
            case TAG_STYLE:
                return new ViewNode(NodeType.STYLE, node.children[0].attrs["#t"] as string)
            case TAG_SCRIPT:
                return new ViewNode(NodeType.SCRIPT, node.children[0].attrs["#t"] as string)
            case TAG_SVG: {
                let nd = new ViewNode(NodeType.SVG, "")
                for (const key in node.attrs) {
                    (nd.mNode as HTMLElement).setAttribute(key, node.attrs[key] as string);

                }

                return nd

            }
        }

        let view = WidgetRegistrar.createInstance(node.tag, this.context, node.tag, node.attrs);

        view.inViewInflated()
        for (let i = 0; i < node.children.length; i++) {
            let result = this.inflateChild(node.children[i])
            if (result != null) {
                view.addView(result as View)
            }
        }
        view.onViewChildInflated()

        return view
    }
}

