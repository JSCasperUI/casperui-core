
import {BXMLParser} from "@casperui/core/utils/bxml/BXMLParser";
import {Context} from "@casperui/core/content/Context";
import {BXNode} from "@casperui/core/utils/bxml/BXNode";
import {View} from "@casperui/core/view/View";
import {ViewNode} from "@casperui/core/view/nodes/ViewNode";
import {NodeType} from "@casperui/core/view/nodes/NodeType";
import {WidgetRegistrar} from "@casperui/core/view/inflater/WidgetRegistrar";


export class BXMLInflater {

    context:Context;
    cacheNodes:Record<number, BXNode>
    constructor(context:Context) {
        this.context = context;
        this.cacheNodes  = {}
    }


    inflate(id:number,cache:boolean = false, root:View|null = null,rootNodeReplace:boolean = false):View{
        let node:BXNode
        if (cache){
            if (this.cacheNodes[id]){
                node = this.cacheNodes[id]
            }else{
                node = (new BXMLParser(this.context.getResources().getBufferById(id))).parse()
                this.cacheNodes[id] = node
            }
        }else{
            node = (new BXMLParser(this.context.getResources().getBufferById(id))).parse()
        }
        let result = this.inflateChild(node) as View
        if (root){
            if (rootNodeReplace){
                root.node = result.node
                for (let i = 0; i < result.getChildren().length; i++) {
                    root.addView(result.children[i])
                }
            }else{
                root.addView(result)
            }

        }
        return result as View
    }

    objectToXml(obj, skipRoot) {
        let xml = '';

        // Функция для преобразования объекта в XML
        function buildXml(obj) {
            // Если необходимо пропустить корневой элемент, обрабатываем только дочерние узлы
            if (skipRoot && obj.childNodes && obj.childNodes.length > 0) {
                obj.childNodes.forEach(childNode => {
                    buildXml(childNode);
                });
            } else {
                // Открываем тег с названием объекта
                xml += `<${obj.tag}`;

                // Добавляем атрибуты объекта, если они есть
                if (obj.attrs) {
                    for (let [key, value] of Object.entries(obj.attrs)) {
                        xml += ` ${key}="${value}"`;
                    }
                }

                // Если есть дочерние узлы, рекурсивно вызываем buildXml для каждого из них
                if (obj.childNodes && obj.childNodes.length > 0) {
                    xml += '>';
                    obj.childNodes.forEach(childNode => {
                        buildXml(childNode);
                    });
                    // Закрываем тег
                    xml += `</${obj.tag}>`;
                } else {
                    // Если нет дочерних узлов, закрываем тег без дополнительного контента
                    xml += '/>';
                }
            }
        }

        // Вызываем функцию для построения XML
        buildXml(obj);

        return xml;
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
                    (nd.node as HTMLElement).setAttribute(key, node.attrs[key] as string);
                    (nd.node as HTMLElement).innerHTML = this.objectToXml(node,true)

                }

                return nd

            }
        }

        let view = WidgetRegistrar.createInstance(node.tag,this.context,node.tag,node.attrs);

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
}

