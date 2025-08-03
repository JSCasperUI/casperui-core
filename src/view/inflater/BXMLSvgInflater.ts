
import {BXMLParser} from "@casperui/core/utils/bxml/BXMLParser";
import {Context} from "@casperui/core/content/Context";
import {BXNode} from "@casperui/core/utils/bxml/BXNode";
import {View} from "@casperui/core/view/View";
import {ViewNode} from "@casperui/core/view/nodes/ViewNode";
import {NodeType} from "@casperui/core/view/nodes/NodeType";
import {WidgetRegistrar} from "@casperui/core/view/inflater/WidgetRegistrar";


export class BXMLSvgInflater {

    private static readonly SVG_NS = "http://www.w3.org/2000/svg";
    private static readonly XLINK_NS = "http://www.w3.org/1999/xlink";
    static inflate(id:number,context:Context):Element{
        let node = (new BXMLParser(context.getResources().getBufferById(id))).readTree()
        return BXMLSvgInflater.inflateChild(node,true)
    }
    

    static inflateChild(node:BXNode,isFirst:boolean = true):Element{

        const element = document.createElementNS("http://www.w3.org/2000/svg", node.tag)

        for (const key in node.attrs) {
            const val = node.attrs[key];
            if (key === "xlink:href") {
                element.setAttributeNS(this.XLINK_NS, key, val as string);
            } else {
                element.setAttribute(key, val as string);
            }
        }

        // Спец-обработка <script> и <style>
        if (node.tag === "script" || node.tag === "style") {
            const text = node.children[0]?.attrs?.["#t"];
            if (typeof text === "string") {
                element.textContent = text;
            }
            return element;
        }
        switch (node.tag){
            case "script":
            case "style":{
                element.textContent = node.children[0].attrs["#t"] as string
                return element
            }
        }

        for (let i = 0; i < node.children.length; i++) {
            let result = this.inflateChild(node.children[i],false)
            if (result!=null){
                element.appendChild(result)
            }
        }



        return element
    }
}

