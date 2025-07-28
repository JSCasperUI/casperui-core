
import {BXMLParser} from "@casperui/core/utils/bxml/BXMLParser";
import {Context} from "@casperui/core/content/Context";
import {BXNode} from "@casperui/core/utils/bxml/BXNode";
import {View} from "@casperui/core/view/View";
import {ViewNode} from "@casperui/core/view/nodes/ViewNode";
import {NodeType} from "@casperui/core/view/nodes/NodeType";
import {WidgetRegistrar} from "@casperui/core/view/inflater/WidgetRegistrar";


export class BXMLInflater {

    mContext:Context;

    cacheNodes:Record<number, BXNode>
    constructor(context:Context) {
        this.mContext = context;
        this.cacheNodes  = {}
    }


    inflate(id:number,cache:boolean = false, root:View|null = null,rootNodeReplace:boolean = false):View{
        let node:BXNode

        if (cache){
            if (this.cacheNodes[id]){
                node = this.cacheNodes[id]
            }else{
                node = (new BXMLParser(this.mContext.getResources().getBufferById(id))).readTree()
                this.cacheNodes[id] = node
            }
        }else{
            node = (new BXMLParser(this.mContext.getResources().getBufferById(id))).readTree()
        }
        let result = this.inflateChild(node) as View
        if (root){
            if (rootNodeReplace){
                root.mNode = result.mNode
                let children = result.getChildren()
                for (let i = 0; i < children.length; i++) {
                    root.addView(children[i])
                }
            }else{
                root.addView(result)
            }

        }
        return result as View
    }



    inflateChild(node:BXNode):ViewNode{
        if (node.isText){
            return new ViewNode(NodeType.TEXT,node.attrs["#t"] as string);
        }

        switch (node.tag){
            case "style": return new ViewNode(NodeType.STYLE,node.children[0].attrs["#t"]as string)
            case "script":return new ViewNode(NodeType.SCRIPT,node.children[0].attrs["#t"] as string)
            case "svg":{
                let nd = new ViewNode(NodeType.SVG,"")
                for (const key in node.attrs) {
                    (nd.mNode as HTMLElement).setAttribute(key, node.attrs[key] as string);
                    (nd.mNode as HTMLElement).innerHTML = this.objectToXml(node,true)

                }

                return nd

            }
        }

        let view = WidgetRegistrar.createInstance(node.tag,this.mContext,node.tag,node.attrs);

        view.inViewInflated()
        for (let i = 0; i < node.children.length; i++) {
            let result = this.inflateChild(node.children[i])
            if (result!=null){
                view.addView(result as View)
            }
        }
        view.onViewChildInflated()

        return view
    }

    objectToXml(obj, skipRoot) {
        let xml = '';

        function buildXml(obj) {
            if (skipRoot && obj.childNodes && obj.childNodes.length > 0) {
                obj.childNodes.forEach(childNode => {
                    buildXml(childNode);
                });
            } else {
                xml += `<${obj.tag}`;

                if (obj.attrs) {
                    for (let [key, value] of Object.entries(obj.attrs)) {
                        xml += ` ${key}="${value}"`;
                    }
                }

                if (obj.childNodes && obj.childNodes.length > 0) {
                    xml += '>';
                    obj.childNodes.forEach(childNode => {
                        buildXml(childNode);
                    });
                    xml += `</${obj.tag}>`;
                } else {
                    xml += '/>';
                }
            }
        }

        buildXml(obj);
        return xml;
    }
}

