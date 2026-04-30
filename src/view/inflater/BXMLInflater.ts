import {BXMLParser} from "@casperui/core/utils/bxml/BXMLParser";
import {Context} from "@casperui/core/content/Context";
import {BXNode} from "@casperui/core/utils/bxml/BXNode";
import {View} from "@casperui/core/view/View";
import {ViewNode} from "@casperui/core/view/nodes/ViewNode";
import {NodeType} from "@casperui/core/view/nodes/NodeType";
import {WidgetRegistrar} from "@casperui/core/view/inflater/WidgetRegistrar";
import {EMPTY_STRING, TAG_SCRIPT, TAG_STYLE, TAG_SVG, TAG_TEMPLATE} from "@casperui/core/space/Constants";
import {Resources} from "@casperui/core/content/Resources";


export class BXMLInflater {

    private cacheNodes: Record<number, BXNode> = {}
    private cacheTemplates: Record<number, BXNode> = {}
    private res: Resources;


    private findNodeByIdRec(root: BXNode, paramId: number): BXNode | null {
        const attrs = root.attrs;
        if (attrs && attrs.id !== undefined && attrs.id === paramId) {
            return root;
        }
        const ch = root.children;
        for (let i = 0; i < ch.length; i++) {
            const found = this.findNodeByIdRec(ch[i], paramId);
            if (found) return found;
        }
        return null;
    }

    constructor(private context: Context) {

    }

    template(id: number, templateId: number): View {
        let node: BXNode
        let tid = (id << 16) | templateId

        if (this.cacheTemplates[tid] === undefined) {
            if (this.cacheNodes[id]) {
                node = this.cacheNodes[id]
            } else {
                node = (new BXMLParser(this.res.getBufferById(id),this.context.getResources())).readTree()
                this.cacheNodes[id] = node
            }
            node = this.findNodeByIdRec(node, templateId);
            if (!node) throw new Error(`Template not found: layoutId=${id}, templateId=${templateId}`);
            this.cacheTemplates[tid] = node
        } else {
            node = this.cacheTemplates[tid]
        }
        let result = this.inflateChild(node) as View

        return result as View
    }

    inflate(id: number, cache: boolean = false, root: View | null = null, rootNodeReplace: boolean = false): View {
        let node: BXNode

        if (cache) {
            if (this.cacheNodes[id]) {
                node = this.cacheNodes[id]
            } else {
                node = (new BXMLParser(this.context.getResources().getBufferById(id),this.context.getResources())).readTree()
                this.cacheNodes[id] = node
            }
        } else {
            node = (new BXMLParser(this.context.getResources().getBufferById(id),this.context.getResources())).readTree()
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
            case TAG_TEMPLATE:{
                return null
            }
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

