import {NodeType} from "@casperui/core/view/nodes/NodeType";

export class ViewNode {
    private mType:NodeType
    mNode:Node

    constructor(type:NodeType|string,content?:string) {
        this.mType = NodeType.ELEMENT;
        if (typeof type === "string") {
            if (type.startsWith("#") && type === "#t") {
                this.mNode = document.createTextNode("");
            }else {
                if (type === "WTAG"){

                }else{
                    this.mNode = document.createElement(type);
                }

            }
        }else{
            this.mType = type;
            switch (type) {
                case NodeType.TEXT:{
                    this.mNode = document.createTextNode(content)
                    break
                }
                case NodeType.STYLE: {
                    this.mNode = document.createElement("style");
                    (this.mNode as HTMLElement).textContent = content
                    break
                }
                case NodeType.SCRIPT: {
                    this.mNode = document.createElement("script");
                    (this.mNode as HTMLElement).textContent = content
                    break
                }
                case NodeType.SVG: {
                    this.mNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                    (this.mNode as SVGSVGElement).innerHTML = content
                    break
                }
            }
        }
    }

    getNode():Node{
        return this.mNode
    }

    getElement():HTMLElement{
        return this.mNode as HTMLElement
    }
}

