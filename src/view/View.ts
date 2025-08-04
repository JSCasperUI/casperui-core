import {ViewNode} from "@casperui/core/view/nodes/ViewNode";
import {Context} from "@casperui/core/content/Context";
import {ViewAttributes} from "@casperui/core/view/ViewAttributes";
import {IFragmentManager} from "@casperui/core/app/IFragmentManager";
import {BXMLSvgInflater} from "@casperui/core/view/inflater/BXMLSvgInflater";
import {NodeType} from "@casperui/core/view/nodes/NodeType";

export type ViewTag = string | Element

export interface IParentView {
    getParentView(): IParentView | null;

    setParentView(parentView?: IParentView): void;

    isFragmentView(): boolean;

}

type FEvent = (event: UIEvent) => any

export class View extends ViewNode implements IParentView {

    static svgCache: Map<number, Element> = new Map();
    static __classListTemp: string[] = [];
    private id: number = -1
    private mContext: Context
    private mChildren: Array<View> = []
    private mCurrentSVGContentId: Number = -1;
    private mIsWaitingDom: boolean = false
    private _textCache: string = null
    private mParentView?: IParentView;

    private _top: number = 0;
    private _translateY: number = 0;


    static CLICK = "click"
    static MOUSE_OVER = "mouseover"
    static MOUSE_DOUBLE_CLICK = "dblclick"
    static MOUSE_MOVE = "mousemove"
    static MOUSE_OUT = "mouseout"
    static MOUSE_DOWN = "mousedown"
    static MOUSE_UP = "mouseup"


    constructor(context: Context, tag?: ViewTag, attr?: ViewAttributes) {
        if (!tag) {
            super("div")
        } else {
            if (tag instanceof Element) {
                super("div")
                this.mNode = tag
            } else {
                super(tag)
            }
            if (attr) {
                this.appendAttributes(attr)
            }
        }

        this.mContext = context

    }

    getId(): number {
        return this.id
    }

    setId(id: number) {
        this.id = id
    }


    ctx(): Context {
        return this.mContext
    }

    inflateSelf(id: number, cache: boolean) {
        this.mContext.getInflater().inflate(id, cache, this, true)
    }

    getFragmentManager(): IFragmentManager {
        let parent: IParentView = this
        while ((parent = parent.getParentView()) != null) {
            if (parent.isFragmentView()) {
                return parent as unknown as IFragmentManager
            }
        }
        return null;
    }

    waitingSelf(callback: () => void) {
        if (this.mIsWaitingDom) return;


        if (document.body.contains(this.mNode)) {
            requestAnimationFrame(() => callback());
            return;
        }
        const observer = new MutationObserver(() => {
            if (document.body.contains(this.mNode)) {
                this.mIsWaitingDom = false
                requestAnimationFrame(() => {
                    callback(); // Элемент добавлен и размеры корректны
                });
                observer.disconnect();
            }
        });

        observer.observe(document.body, {childList: true, subtree: true});
    }


    onViewChildInflated() {
    }

    appendAttributes(attrs: any) {
        if (!this.mNode) {
            return
        }
        const node = this.mNode as HTMLElement;
        let keys = Object.keys(attrs)
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i]
            switch (key) {
                case "id":
                    this.id = attrs[key];
                    break;
                case "class":
                    this.addClassList(attrs[key]);
                    break;
                default:
                    node.setAttribute(key, attrs[key]);
                    break;
            }
            // if (key === "id") {
            //     this.id = attrs[key]
            // }else if (key === "class"){
            //     this.addClassList(attrs[key])
            // }else{
            //     node.setAttribute(key,attrs[key])
            // }
        }
    }

    replaceSelf(newView: View) {


    }

    addView(view: View, index?: number) {

        if (view instanceof View) {
            view.setParentView(this)
        }
        if (index === undefined || index === -1) {
            this.mChildren.push(view)
            this.mNode.appendChild(view.mNode)
            return
        }
        this.mChildren.splice(index, 0, view);
        this.mNode.insertBefore(view.mNode, this.mNode.childNodes[index])
    }

    removeAllViews() {

        for (let i = 0; i < this.mChildren.length; i++) {
            this.mChildren[i].setParentView(null)
        }

        // const node = this.mNode as HTMLElement;
        // while (node.firstChild) node.removeChild(node.firstChild);

        this.mChildren.length = 0; // быстрее, чем присваивать []
        (this.mNode as HTMLElement).innerHTML = ""
    }

    removeView(content: View) {
        let index = this.getChildren().indexOf(content)
        if (index < 0) {
            return
        }
        content.setParentView(null)
        this.mChildren.splice(index, 1);
        this.mNode.removeChild(content.mNode)

    }

    hasView(content: View): boolean {
        return this.getChildren().indexOf(content) !== -1
    }

    indexView(view: View) {
        return this.getChildren().indexOf(view)
    }

    byIds(ids: number[]): View[] {
        let out = []
        for (let i = 0; i < ids.length; i++) {
            out.push(this.byId(ids[i]))
        }
        return out
    }
    private static _searchStack: View[] = [];
    byId(id: number): View | null {
        if (this.id === id)
            return this

        const items = this.mChildren

        for (let i = 0; i < items.length; i++) {
            const itm = items[i]
            if (itm.mType === NodeType.ELEMENT) {
                let current = itm.byId(id)
                if (current) {
                    return current
                }
            }
        }
        return null
    }

    byPath( path: number[]): View | null {
        if (path.length === 0 ) return this
        let node = this as View;
        for (const i of path) {
            if (!node.mChildren[i]) return null;
            node = node.mChildren[i];
        }
        return node;
    }

    getChildren(): Array<View> {
        return this.mChildren
    }

    inViewInflated() {

    }

    activate() {
        this.addClass("active")
    }

    deactivate() {
        this.removeClass("active")
    }

    handleViewError() {
        this.removeClass("e_snake")
        setTimeout(() => {
            this.addClass("e_snake")
        }, 1)

    }

    getWidth() {
        return (this.mNode as HTMLElement).clientWidth
    }

    setWidth(width: number) {
        (this.mNode as HTMLElement).style.width = `${width}px`
    }

    getHeight() {
        return (this.mNode as HTMLElement).clientHeight
    }

    setHeight(height: number) {
        (this.mNode as HTMLElement).style.height = `${height}px`
    }

    setOpacity(value: number) {
        if (value === 1) {
            (this.mNode as HTMLElement).style.opacity = ''
        } else {
            (this.mNode as HTMLElement).style.opacity = `${value}`
        }
    }

    getOpacity() {
        return parseFloat((this.mNode as HTMLElement).style.opacity)
    }

    getVisibility(): boolean {
        return (this.mNode as HTMLElement).style.display !== "none";
    }

    setVisibility(value: boolean) {
        if (value) {
            (this.mNode as HTMLElement).style.display = "";
        } else {
            (this.mNode as HTMLElement).style.display = "none";
        }
    }

    setTextContent(text: string) {
        if (this._textCache && this._textCache == text) return
        if (this.mNode.firstChild && this.mNode.childNodes.length === 1 && this.mNode.firstChild.nodeType === 3) {
            this._textCache = text
            this.mNode.firstChild.nodeValue = text;
        } else {
            this._textCache = text
            this.mNode.textContent = text;
        }
    }


    isHovered(): boolean {
        return (this.mNode as HTMLElement).matches(':hover')
    }

    addClassList(className: string) {
        let i = 0, start = 0, len = className.length;
        let count = 0;
        while (i < len) {
            while (i < len && className[i] === ' ') i++;
            start = i;
            while (i < len && className[i] !== ' ') i++;
            if (i > start) {
                if (count < View.__classListTemp.length) {
                    View.__classListTemp[count] = className.substring(start, i);
                } else {
                    View.__classListTemp.push(className.substring(start, i));
                }
                count++;
            }
        }
        if (count > 0) {
            View.__classListTemp.length = count;
            (this.mNode as HTMLElement).classList.add(...View.__classListTemp);
            // View.__classListTemp.length = 0;
        }
    }

    addClass(className: string) {
        (this.mNode as HTMLElement).classList.add(className)
    }

    removeClass(className: string) {
        (this.mNode as HTMLElement).classList.remove(className)
    }

    swapClass(removeClass: string, setClass: string) {
        this.removeClass(removeClass)
        this.addClass(setClass)
    }

    getValue() {
        return (this.mNode as HTMLInputElement).value
    }

    setSafeValue(value: any) {
        if (value === undefined || value === null) {
            this.setValue("")
        } else {
            this.setValue(value)
        }
    }

    setValue(value: string) {
        (this.mNode as HTMLInputElement).value = value
    }

    setBoolValue(value: boolean) {
        (this.mNode as HTMLInputElement).checked = value
    }

    isChecked(): boolean {
        return (this.mNode as HTMLInputElement).checked
    }

    setLeft(value: number) {
        (this.mNode as HTMLElement).style.left = `${value}px`
    }

    getLeft(): number {
        let v = (this.mNode as HTMLElement).style.left
        if (v.length === 0) {
            return 0
        }
        return parseFloat(v.replace("px", ""))
    }


    setTop(value: number) {
        this._top = value;
        (this.mNode as HTMLElement).style.top = value + "px";
    }

    getTop(): number {
        return this._top;
    }

    setTranslateY(value: number) {
        this._translateY = value;
        (this.mNode as HTMLElement).style.transform = `translateY(${value}px)`;
    }

    getTranslateY(): number {
        return this._translateY
    }

    getTopReal(): number {
        let v = (this.mNode as HTMLElement).style.top
        if (v.length === 0) {
            return 0
        }
        return parseFloat(v.replace("px", ""))
    }


    setOnClickListener(func: FEvent) {
        this.makeSafeEvent("click", func)
    }

    vEvent(event: string, func: FEvent) {
        this.makeSafeEvent(event, func)
    }


    makeSafeEvent(type: string, func: FEvent) {
        if (this["_old_fn_" + type]) {
            this.mNode.removeEventListener(type, this["_old_fn_" + type]); // Удаление предыдущего обработчика
        }
        const ref = new WeakRef(func)
        this["_keeper_" + type] = func
        this["_old_fn_" + type] = (e) => {
            let fn = ref.deref()
            if (fn) {
                fn(e)
            }
        };
        this.mNode.addEventListener(type, this["_old_fn_" + type]);
    }

    getStyle(): CSSStyleDeclaration {
        return (this.mNode as HTMLElement).style
    }

    onMouseOverListener(func: FEvent) {
        this.makeSafeEvent("mouseover", func)
    }

    onMouseDoubleClickListener(func: FEvent) {
        this.makeSafeEvent("dblclick", func)
    }


    onMouseOutListener(func: FEvent) {
        this.makeSafeEvent("mouseout", func)
    }


    onMouseMoveListener(func: FEvent) {
        this.makeSafeEvent("mousemove", func)
    }

    onMouseClickListener(func: FEvent) {
        this.makeSafeEvent("click", func)
    }


    onMouseDownListener(func: FEvent) {
        this.makeSafeEvent("mousedown", func)
    }


    setOnMouseOver(func: FEvent) {

        this.makeSafeEvent("mouseover", func)

    }


    setOnMouseOut(func: FEvent) {
        this.makeSafeEvent("mouseout", func)

    }

    setOnFastClickListener(func: FEvent) {
        this.makeSafeEvent("mousedown", func)
    }

    setParameter(name: string, value: any) {
        (this.mNode as HTMLElement).setAttribute(name, value)
    }

    getParameter(name: string): string {
        return (this.mNode as HTMLElement).getAttribute(name)
    }

    getParent() {
        return null
    }

    setSVGContent(svg: string) {
        (this.mNode as HTMLElement).innerHTML = svg
    }

    setSVGById(id: number) {
        if (this.mCurrentSVGContentId === id) return;

        const node = this.mNode as HTMLElement;


        let svgElement = View.svgCache.get(id);
        if (!svgElement) {
            svgElement = BXMLSvgInflater.inflate(id, this.mContext)
        }
        node.innerHTML = "";
        node.appendChild(svgElement.cloneNode(true));
    }

    setImageSrc(url: string) {
        (this.mNode as HTMLImageElement).src = url// `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`
    }

    getScrollY(): number {
        return (this.mNode as HTMLElement).scrollTop
    }

    setScrollY(value: number) {
        (this.mNode as HTMLElement).scrollTop = value;
    }

    getScrollX(): number {
        return (this.mNode as HTMLElement).scrollLeft
    }

    setScrollX(value: number) {
        (this.mNode as HTMLElement).scrollLeft = value
    }

    getParentView(): IParentView {
        return this.mParentView;
    }

    isFragmentView(): boolean {
        return false;
    }

    setParentView(parentView?: IParentView): void {
        this.mParentView = parentView;
    }


}

