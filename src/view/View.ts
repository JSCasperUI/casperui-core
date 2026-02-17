import {ViewNode} from "@casperui/core/view/nodes/ViewNode";
import {Context} from "@casperui/core/content/Context";
import {ViewAttributes} from "@casperui/core/view/ViewAttributes";
import {IFragmentManager} from "@casperui/core/app/IFragmentManager";
import {BXMLSvgInflater} from "@casperui/core/view/inflater/BXMLSvgInflater";
import {NodeType} from "@casperui/core/view/nodes/NodeType";
import {
    ACTIVE, CLICK,
    EMPTY_STRING,
    MOUSE_DOUBLE_CLICK, MOUSE_DOWN, MOUSE_MOVE,
    MOUSE_OUT,
    MOUSE_OVER,
    NONE, POSTFIX_PX,
    SNAKE_ANIM, TAG_DIV
} from "@casperui/core/space/Constants";

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


    constructor(context: Context, tag?: ViewTag, attr?: ViewAttributes) {
        if (!tag) {
            super(TAG_DIV)
        } else {
            if (tag instanceof Element) {
                super(TAG_DIV)
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
        return this;
    }


    ctx(): Context {
        return this.mContext
    }

    inflateSelf(id: number, cache: boolean) {
        this.mContext.getInflater().inflate(id, cache, this, true)
        return this;
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
        return this;
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
        return this;
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
        return this;
    }

    removeAllViews() {

        for (let i = 0; i < this.mChildren.length; i++) {
            this.mChildren[i].setParentView(null)
        }


        this.mChildren.length = 0; // быстрее, чем присваивать []
        (this.mNode as HTMLElement).innerHTML = ""
        return this;
    }

    removeView(content: View) {
        let index = this.getChildren().indexOf(content)
        if (index < 0) {
            return
        }
        content.setParentView(null)
        this.mChildren.splice(index, 1);
        this.mNode.removeChild(content.mNode)
        return this;

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

    byPath(path: number[]): View | null {
        if (path.length === 0) return this
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
        this.addClass(ACTIVE)
        return this;
    }

    deactivate() {
        this.removeClass(ACTIVE)
        return this;
    }

    handleViewError() {
        this.removeClass(SNAKE_ANIM)
        setTimeout(() => {
            this.addClass(SNAKE_ANIM)
        }, 1)

        return this;

    }

    getWidth() {
        return (this.mNode as HTMLElement).clientWidth
    }

    setWidth(width: number) {
        (this.mNode as HTMLElement).style.width = width + POSTFIX_PX
        return this;
    }

    getHeight() {
        return (this.mNode as HTMLElement).clientHeight
    }

    setHeight(height: number) {
        (this.mNode as HTMLElement).style.height = height + POSTFIX_PX
        return this;
    }

    setOpacity(value: number) {
        if (value === 1) {
            (this.mNode as HTMLElement).style.opacity = EMPTY_STRING
        } else {
            (this.mNode as HTMLElement).style.opacity = value.toString()
        }
        return this;
    }

    getOpacity() {
        return parseFloat((this.mNode as HTMLElement).style.opacity)
    }

    getVisibility(): boolean {
        return (this.mNode as HTMLElement).style.display !== NONE;
    }

    setVisibility(value: boolean) {
        if (value) {
            (this.mNode as HTMLElement).style.display = EMPTY_STRING;
        } else {
            (this.mNode as HTMLElement).style.display = NONE;
        }
        return this;
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
        return this;
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
        return this;
    }

    addClass(className: string) {
        (this.mNode as HTMLElement).classList.add(className)
        return this;
    }

    removeClass(className: string) {
        (this.mNode as HTMLElement).classList.remove(className)
        return this;
    }

    swapClass(removeClass: string, setClass: string) {
        this.removeClass(removeClass)
        this.addClass(setClass)
        return this;
    }



    setSafeValue(value: any) {
        if (value === undefined || value === null) {
            this.setValue(EMPTY_STRING)
        } else {
            this.setValue(value)
        }
        return this;
    }

    show() {
        this.setVisibility(true);
        return this;
    }

    hide() {
        this.setVisibility(false);
        return this;
    }

    toggle(visible?: boolean) {
        this.setVisibility(visible ?? !this.getVisibility());
        return this;
    }
    getValue():string {
        return (this.mNode as HTMLInputElement).value
    }
    setValue(value: string) {
        (this.mNode as HTMLInputElement).value = value
        return this
    }

    setChecked(value: boolean) {
        (this.mNode as HTMLInputElement).checked = value
        return this
    }
    isChecked(): boolean {
        return (this.mNode as HTMLInputElement).checked
    }

    setLeft(value: number) {
        (this.mNode as HTMLElement).style.left = value + POSTFIX_PX
        return this;
    }

    getLeft(): number {
        let v = (this.mNode as HTMLElement).style.left
        if (v.length === 0) {
            return 0
        }
        return parseFloat(v.replace(POSTFIX_PX, EMPTY_STRING))
    }


    setTop(value: number) {
        this._top = value;
        (this.mNode as HTMLElement).style.top = value + POSTFIX_PX;
        return this;
    }

    getTop(): number {
        return this._top;
    }

    setTranslateY(value: number) {
        this._translateY = value;
        (this.mNode as HTMLElement).style.transform = `translateY(${value}px)`;
        return this;
    }

    getTranslateY(): number {
        return this._translateY
    }

    getTopReal(): number {
        let v = (this.mNode as HTMLElement).style.top
        if (v.length === 0) {
            return 0
        }
        return parseFloat(v.replace(POSTFIX_PX, EMPTY_STRING))
    }


    setOnClickListener(func: FEvent) {
        this.makeSafeEvent(CLICK, func)
        return this;
    }

    vEvent(event: string, func: FEvent) {
        this.makeSafeEvent(event, func)
        return this;
    }

    html(content: string) {
        (this.mNode as HTMLElement).innerHTML = content;
        return this;
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
        return this;
    }

    getStyle(): CSSStyleDeclaration {
        return (this.mNode as HTMLElement).style
    }
    setStyle(key:string, value:string) {
        (this.mNode as HTMLElement).style[key] = value;
        return this;
    }

    hasClass(className: string): boolean {
        return (this.mNode as HTMLElement).classList.contains(className);
    }

    onMouseOverListener(func: FEvent) {
        this.makeSafeEvent(MOUSE_OVER, func)
        return this;
    }

    onMouseDoubleClickListener(func: FEvent) {
        this.makeSafeEvent(MOUSE_DOUBLE_CLICK, func)
        return this;
    }


    onMouseOutListener(func: FEvent) {
        this.makeSafeEvent(MOUSE_OUT, func)
        return this;
    }


    onMouseMoveListener(func: FEvent) {
        this.makeSafeEvent(MOUSE_MOVE, func)
        return this;
    }

    onMouseClickListener(func: FEvent) {
        this.makeSafeEvent(CLICK, func)
        return this;
    }


    onMouseDownListener(func: FEvent) {
        this.makeSafeEvent(MOUSE_DOWN, func)
        return this;
    }


    setOnFastClickListener(func: FEvent) {
        this.makeSafeEvent(MOUSE_DOWN, func)
        return this;
    }

    setParameter(name: string, value: any) {
        (this.mNode as HTMLElement).setAttribute(name, value)
        return this;
    }

    getParameter(name: string): string {
        return (this.mNode as HTMLElement).getAttribute(name)
    }



    setSVGById(id: number) {
        if (this.mCurrentSVGContentId === id) return;

        const node = this.mNode as HTMLElement;


        let svgElement = View.svgCache.get(id);
        if (!svgElement) {
            svgElement = BXMLSvgInflater.inflate(id, this.mContext)
            View.svgCache.set(id, svgElement)
        }
        node.innerHTML = EMPTY_STRING;
        node.appendChild(svgElement.cloneNode(true));
        return this;
    }

    setImageSrc(url: string) {
        (this.mNode as HTMLImageElement).src = url
        return this;
    }

    getScrollY(): number {
        return (this.mNode as HTMLElement).scrollTop
    }

    setScrollY(value: number) {
        (this.mNode as HTMLElement).scrollTop = value;
        return this;
    }

    getScrollX(): number {
        return (this.mNode as HTMLElement).scrollLeft
    }

    setScrollX(value: number) {
        (this.mNode as HTMLElement).scrollLeft = value
        return this;
    }

    getParentView(): IParentView {
        return this.mParentView;
    }

    isFragmentView(): boolean {
        return false;
    }

    setParentView(parentView?: IParentView) {
        this.mParentView = parentView;
        return this;
    }


}

