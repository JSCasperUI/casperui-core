import {NodeType} from "@casperui/core/view/nodes/NodeType";

export class ViewNode {
    private type:NodeType
    node:Node

    constructor(type:NodeType|string,content?:string) {
        this.type = NodeType.ELEMENT;
        if (typeof type === "string") {
            if (type.startsWith("#") && type === "#t") {
                this.node = document.createTextNode("");
            }else {
                if (type === "WTAG"){

                }else{
                    this.node = document.createElement(type);
                }

            }
        }else{
            this.type = type;
            switch (type) {
                case NodeType.TEXT:{
                    this.node = document.createTextNode(content)
                    break
                }
                case NodeType.STYLE: {
                    this.node = document.createElement("style");
                    (this.node as HTMLElement).innerHTML = content
                    break
                }
                case NodeType.SCRIPT: {
                    this.node = document.createElement("script");
                    (this.node as HTMLElement).innerHTML = content
                    break
                }
                case NodeType.SVG: {
                    this.node = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                    (this.node as HTMLElement).innerHTML = content
                    break
                }
            }
        }



    }

    getNode():Node{
        return this.node
    }

    getElement():HTMLElement{
        return this.node as HTMLElement
    }
}

