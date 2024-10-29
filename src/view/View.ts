import {ViewNode} from "@casperui/core/view/nodes/ViewNode";
import {Context} from "@casperui/core/content/Context";
import {BXMLInflater} from "@casperui/core/view/inflater/BXMLInflater";
import {ViewAttributes} from "@casperui/core/view/ViewAttributes";

export type ViewTag = string|Element
export class View extends ViewNode {

    id:number = -1
    context:Context

    children:Array<View> = []

    currentSVGContentId:Number = -1;
    isWaitingDom:boolean = false
    inflater:BXMLInflater

    constructor(context:Context,tag?:ViewTag,attr?:ViewAttributes) {
        if (!tag){
            super("div")
        }else {
            if (tag instanceof Element){
                super("div")
                this.node = tag
            }else {
                super(tag)
            }
            if (attr){
                this.appendAttributes(attr)
            }
        }


        // if (!args) {
        //     super("div");
        //     this.id = -1
        // } else if (args.length === 1 && typeof args[0] === "string"){//(context: Context, tag: String)
        //     super(args[0]);
        //     this.id = -1
        // } else if (args.length === 1 && typeof args[0] === "object"){//(context: Context, tag: Element)
        //     super("div");
        //     this.node = args[0]
        //     this.id = -1
        // }else if (args.length === 2 ){//(context: Context, tag: String, attributes:HashMap<String, DType>)
        //     super(args[0]);
        //     this.id = -1
        //     if (args[1]){
        //         this.appendAttributes(args[1])
        //     }
        // }else{
        //     super("div");
        //     this.id = -1
        // }
        this.context = context

    }

    init(){
        this.id = -1
    }


    inflateSelf(id:number,cache:boolean){
        this.inflater = this.context.getInflater()// (this.context as Activity).getLayoutInflater()
        this.inflater.inflate(id, cache, this, true)
    }



    waitingSelf( callback: () => void) {
        if (this.isWaitingDom) return;


        if (document.body.contains(this.node)) {
            requestAnimationFrame(() => callback());
            return;
        }


        // Иначе наблюдаем за добавлением элемента в DOM
        const observer = new MutationObserver(() => {
            if (document.body.contains(this.node)) {
                this.isWaitingDom = false
                requestAnimationFrame(() => {
                    callback(); // Элемент добавлен и размеры корректны
                });
                observer.disconnect();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }


    /** @public */
    onViewChildInflated(){
    }

    appendAttributes(attrs:any){
        if (!this.node){
            return
        }
        for (const key in attrs) {


            if (key === "id") {
                this.id = parseInt(attrs[key])
            }else if (key === "class"){
                this.addClassList(attrs[key])
            }else{
                 this.getElement().setAttribute(key,attrs[key])
             }
            // this.node.setAttribute(key,attrs[key])
        }
    }
    addView(view:View,index?:number){
        if (index === undefined || index === -1){
            index = this.children.length
        }
        this.children.splice( index, 0,view);
        this.node.insertBefore(view.getNode(), this.node.childNodes[index])
        // this.node.parentNode.insertBefore(view.getNode(),this.node.nextSibling)
        // this.node.insertBefore(view.getNode(), this.node.childNodes[index])
    }
    removeAllViews(){
        this.children = []

        this.getElement().innerHTML = ""
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
        this.children.splice(index, 1);
        this.node.removeChild(content.getNode())
    }


    byId(id:number):View|null{
        if (this.id === id){
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
        return this.children
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

    getHeight(){
        return (this.node as HTMLElement).clientHeight
    }
    getWidth(){
        return (this.node as HTMLElement).clientWidth
    }

    setWidth(width:number) {
        (this.node as HTMLElement).style.width = `${width}px`
    }


    setOpacity(value:number){
        if (value === 1){
            (this.node as HTMLElement).style.opacity = ''
        }else{
            (this.node as HTMLElement).style.opacity = `${value}`
        }
    }
    getOpacity(){
        return parseFloat((this.node as HTMLElement).style.opacity)
    }
    getVisibility():boolean {
        return (this.node as HTMLElement).style.display !== "none";
    }
    setVisibility(value:boolean){
        if (value){
            (this.node as HTMLElement).style.display = "";
        }else{
            (this.node as HTMLElement).style.display = "none";
        }
    }


    setHeight(height:number) {
        (this.node as HTMLElement).style.height = `${height}px`
    }
    setTextContent(text:string){
        this.node.textContent = text
    }

    isHovered():boolean{
        return (this.node as HTMLElement).matches(':hover')
    }
    addClassList(className:string){
        if (className && className.length)
        className.split(" ").forEach(cName=> (this.node as HTMLElement).classList.add(cName))

    }
    addClass(className:string){
        (this.node as HTMLElement).classList.add(className)
    }
    removeClass(className:string){
        (this.node as HTMLElement).classList.remove(className)
    }
    swapClass(removeClass:string,setClass:string){
        this.removeClass(removeClass)
        this.addClass(setClass)
    }

    getValue(){
        return (this.node as HTMLInputElement).value
    }
    setValue(value:string|number){
        if (typeof value === "string") {
            (this.node as HTMLInputElement).value = value
        }else{
            (this.node as HTMLInputElement).value = value.toString()

        }
    }

    setBoolValue(value:boolean){
        (this.node as HTMLInputElement).checked = value
    }
    isChecked(){
        return (this.node as HTMLInputElement).checked
    }

    setLeft(value:number){
        (this.node as HTMLElement).style.left = `${value}px`
    }
    getLeft():number{
        let v = (this.node as HTMLElement).style.left
        if (v.length === 0){
            return 0
        }
        return parseFloat(v.replace("px",""))
    }
    setTop(value:number){
        (this.node as HTMLElement).style.top = `${value}px`
    }
    getTop():number{
        let v = (this.node as HTMLElement).style.top
        if (v.length === 0){
            return 0
        }
        return parseFloat(v.replace("px",""))
    }


    setOnClickListener(func:EventListenerOrEventListenerObject){
        this.makeSafeEvent("click",func)
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
        this.getElement().setAttribute(name, value)
    }

    getParameter(name:string):string {
        return this.getElement().getAttribute(name)
    }

    getParent(){
        return null
    }

    setSVGContent(svg:string){
        (this.node as HTMLElement).innerHTML = svg
    }

    setSVGById(id:number){
        if (this.currentSVGContentId !== id){
            this.currentSVGContentId = id;
            (this.node as HTMLElement).innerHTML = this.context.getResources().getDataString(id)
        }

    }

    setImageSrc(url:string){
        (this.node as HTMLImageElement).src = url// `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`
    }


    getScrollY():number {
        return (this.node as HTMLElement).scrollTop
    }


    getScrollX():number {
        return (this.node as HTMLElement).scrollLeft
    }


}

