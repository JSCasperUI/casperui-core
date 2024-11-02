import {ViewNode} from "@casperui/core/view/nodes/ViewNode";
import {Context} from "@casperui/core/content/Context";
import {BXMLInflater} from "@casperui/core/view/inflater/BXMLInflater";
import {ViewAttributes} from "@casperui/core/view/ViewAttributes";

export type ViewTag = string|Element
export class View extends ViewNode {
    private mId:number = -1
    private mContext:Context
    private mChildren:Array<View> = []
    private mCurrentSVGContentId:Number = -1;
    private mIsWaitingDom:boolean = false

    static  CLICK = "click"
    static  MOUSE_OVER = "mouseover"
    static  MOUSE_DOUBLE_CLICK = "dblclick"
    static  MOUSE_MOVE = "mousemove"
    static  MOUSE_OUT = "mouseout"
    static  MOUSE_DOWN = "mousedown"
    static  MOUSE_UP = "mouseup"


    constructor(context:Context,tag?:ViewTag,attr?:ViewAttributes) {
        if (!tag){
            super("div")
        }else {
            if (tag instanceof Element){
                super("div")
                this.mNode = tag
            }else {
                super(tag)
            }
            if (attr){
                this.appendAttributes(attr)
            }
        }

        this.mContext = context

    }

    getId(){
        return this.mId
    }
    setId(id:number){
        this.mId = id
    }


    ctx():Context {
        return this.mContext
    }

    inflateSelf(id:number,cache:boolean){
        this.mContext.getInflater().inflate(id, cache, this, true)
    }



    waitingSelf( callback: () => void) {
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

        observer.observe(document.body, { childList: true, subtree: true });
    }



    onViewChildInflated(){
    }

    appendAttributes(attrs:any){
        if (!this.mNode){
            return
        }
        let keys = Object.keys(attrs)

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i]
            if (key === "id") {
                this.mId = parseInt(attrs[key])
            }else if (key === "class"){
                this.addClassList(attrs[key])
            }else{
                (this.mNode as HTMLElement).setAttribute(key,attrs[key])
            }
        }

        // for (const key in attrs) {
        //     if (key === "id") {
        //         this.id = parseInt(attrs[key])
        //     }else if (key === "class"){
        //         this.addClassList(attrs[key])
        //     }else{
        //          this.getElement().setAttribute(key,attrs[key])
        //      }
        // }
    }
    addView(view:View,index?:number){
        if (index === undefined || index === -1){
            index = this.mChildren.length
        }
        this.mChildren.splice( index, 0,view);
        this.mNode.insertBefore(view.getNode(), this.mNode.childNodes[index])
        // this.node.parentNode.insertBefore(view.getNode(),this.node.nextSibling)
        // this.node.insertBefore(view.getNode(), this.node.childNodes[index])
    }
    removeAllViews(){
        this.mChildren = [];

        (this.mNode as HTMLElement).innerHTML = ""
    }


    hasView(content:View):boolean{
        return this.getChildren().indexOf(content) !==-1
    }

    indexView(view:View){
        return this.getChildren().indexOf(view)
    }



    removeView(content:View){
        let index = this.getChildren().indexOf(content)
        if (index===-1){
            return
        }
        this.mChildren.splice(index, 1);
        this.mNode.removeChild(content.getNode())
    }


    byId(id:number):View|null{
        if (this.mId === id){
            return this
        }
        for (const child of this.getChildren()) {
            if (child instanceof View){
                let current = child.byId(id)
                if (current){
                    return current
                }
            }
        }
        return null
    }


    getChildren():Array<View>{
        return this.mChildren
    }

    inViewInflated(){

    }

    activate(){
        this.addClass("active")
    }
    deactivate(){
        this.removeClass("active")
    }

    handleViewError(){
        this.removeClass("e_snake")
        setTimeout(()=>{
            this.addClass("e_snake")
        },1)

    }

    getWidth(){
        return (this.mNode as HTMLElement).clientWidth
    }
    getHeight(){
        return (this.mNode as HTMLElement).clientHeight
    }

    setWidth(width:number) {
        (this.mNode as HTMLElement).style.width = `${width}px`
    }
    setHeight(height:number) {
        (this.mNode as HTMLElement).style.height = `${height}px`
    }

    setOpacity(value:number){
        if (value === 1){
            (this.mNode as HTMLElement).style.opacity = ''
        }else{
            (this.mNode as HTMLElement).style.opacity = `${value}`
        }
    }
    getOpacity(){
        return parseFloat((this.mNode as HTMLElement).style.opacity)
    }
    getVisibility():boolean {
        return (this.mNode as HTMLElement).style.display !== "none";
    }
    setVisibility(value:boolean){
        if (value){
            (this.mNode as HTMLElement).style.display = "";
        }else{
            (this.mNode as HTMLElement).style.display = "none";
        }
    }



    setTextContent(text:string){
        this.mNode.textContent = text
    }

    isHovered():boolean{
        return (this.mNode as HTMLElement).matches(':hover')
    }
    addClassList(className:string){
        if (className && className.length){
            if (className.indexOf(" ")>0){
                className.split(" ").forEach(cName=> (this.mNode as HTMLElement).classList.add(cName))
            }else{
                (this.mNode as HTMLElement).classList.add(className);
            }
        }


    }
    addClass(className:string){
        (this.mNode as HTMLElement).classList.add(className)
    }
    removeClass(className:string){
        (this.mNode as HTMLElement).classList.remove(className)
    }
    swapClass(removeClass:string,setClass:string){
        this.removeClass(removeClass)
        this.addClass(setClass)
    }

    getValue(){
        return (this.mNode as HTMLInputElement).value
    }
    setValue(value:string|number){
        if (typeof value === "string") {
            (this.mNode as HTMLInputElement).value = value
        }else{
            (this.mNode as HTMLInputElement).value = value.toString()

        }
    }

    setBoolValue(value:boolean){
        (this.mNode as HTMLInputElement).checked = value
    }
    isChecked(){
        return (this.mNode as HTMLInputElement).checked
    }

    setLeft(value:number){
        (this.mNode as HTMLElement).style.left = `${value}px`
    }
    getLeft():number{
        let v = (this.mNode as HTMLElement).style.left
        if (v.length === 0){
            return 0
        }
        return parseFloat(v.replace("px",""))
    }
    setTop(value:number){
        (this.mNode as HTMLElement).style.top = `${value}px`
    }
    getTop():number{
        let v = (this.mNode as HTMLElement).style.top
        if (v.length === 0){
            return 0
        }
        return parseFloat(v.replace("px",""))
    }


    setOnClickListener(func:EventListenerOrEventListenerObject){
        this.makeSafeEvent("click",func)
    }
    vEvent(event:string,func:EventListenerOrEventListenerObject){
        this.makeSafeEvent(event,func)
    }


    makeSafeEvent(type:string,func:any){
        if (this["_old_fn_"+type]) {
            this.getNode().removeEventListener(type, this["_old_fn_"+type]); // Удаление предыдущего обработчика
        }
        const ref = new WeakRef(func)
        this["_keeper_"+type] =  func
        this["_old_fn_"+type] = (e)=>{
            let fn = ref.deref()
            if (fn){
                fn(e)
            }
        };
        this.getNode().addEventListener(type, this["_old_fn_"+type]);
    }

    onMouseOverListener(func:EventListenerOrEventListenerObject){
        this.makeSafeEvent("mouseover",func)
    }

    onMouseDoubleClickListener(func:EventListenerOrEventListenerObject){
        this.makeSafeEvent("dblclick",func)
    }


    onMouseOutListener(func:EventListenerOrEventListenerObject){
        this.makeSafeEvent("mouseout",func)
    }


    onMouseMoveListener(func:EventListenerOrEventListenerObject){
        this.makeSafeEvent("mousemove",func)
    }

    onMouseClickListener(func:EventListenerOrEventListenerObject){
        this.makeSafeEvent("click",func)
    }


    onMouseDownListener(func:EventListenerOrEventListenerObject){
        this.makeSafeEvent("mousedown",func)
    }


    setOnMouseOver(func:EventListenerOrEventListenerObject){

        this.makeSafeEvent("mouseover",func)

    }


    setOnMouseOut(func:EventListenerOrEventListenerObject){
        this.makeSafeEvent("mouseout",func)

    }

    setOnFastClickListener(func:EventListenerOrEventListenerObject){
        this.makeSafeEvent("mousedown",func)
    }

    setParameter(name:string, value:any) {
        (this.mNode as HTMLElement).setAttribute(name, value)
    }

    getParameter(name:string):string {
        return (this.mNode as HTMLElement).getAttribute(name)
    }

    getParent(){
        return null
    }

    setSVGContent(svg:string){
        (this.mNode as HTMLElement).innerHTML = svg
    }

    setSVGById(id:number){
        if (this.mCurrentSVGContentId !== id){
            this.mCurrentSVGContentId = id;
            (this.mNode as HTMLElement).innerHTML = this.mContext.getResources().getDataString(id)
        }

    }

    setImageSrc(url:string){
        (this.mNode as HTMLImageElement).src = url// `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`
    }


    getScrollY():number {
        return (this.mNode as HTMLElement).scrollTop
    }


    getScrollX():number {
        return (this.mNode as HTMLElement).scrollLeft
    }


}

