import {ILiveManager} from "@casperui/core/live/ILiveManager";
import {createFragmentMemory, FragmentMemory, IFragmentManager} from "@casperui/core/app/IFragmentManager";
import {FragmentManager} from "@casperui/core/app/FragmentManager";
import {ContextWrapper} from "@casperui/core/content/ContextWrapper";
import {LiveManager} from "@casperui/core/live/LiveManager";
import {IParentView, View} from "@casperui/core/view/View";
import {BXMLInflater} from "@casperui/core/view/inflater/BXMLInflater";


export class Activity extends ContextWrapper implements ILiveManager, IFragmentManager, IParentView {

    private liveManager:LiveManager = new LiveManager();
    private fragmentMemory:FragmentMemory
    private fragmentManager:FragmentManager
    private window:View
    private root:View
    private inflater:BXMLInflater
    constructor() {
        super();
        this.fragmentMemory = createFragmentMemory()
        this.fragmentManager = new FragmentManager(this,true)
        this.root = new View(this,document.body)
        this.window = new View(this,document.body)
        this.inflater = new BXMLInflater(this)
    }

    getInflater(): BXMLInflater {
        return this.inflater
    }

    getLiveManager(){
        return this.liveManager;
    }

    getRootView():View{
        return this.root
    }

    getWindowView():View{
        return this.window
    }

    createActivity(){
        this.onCreate()
        this.fragmentManager.attachFragmentManager()
        this.liveManager.activate()
    }
    onCreate(){

    }
    onLayout(){
    }

    byId(id:number):View{
        return this.root.byId(id)
    }


    getLayoutInflater():BXMLInflater{
        return this.inflater
    }


    setContentView(layoutId:number){
        (this.root.mNode as HTMLElement).innerHTML = "";
        this.inflater.inflate(layoutId,false,this.root);
        this.onLayout()
    }

    addAttachEventListener(listener:any){
        listener()
    }


    getView():View{
        return this.root
    }

    getFragmentMemory(): FragmentMemory {
        return this.fragmentMemory
    }

    getFragmentManager(): FragmentManager {
        return this.fragmentManager;
    }

    innerBinders: any;

    getParentView(): IParentView | null {
        return this;
    }

    isFragmentView(): boolean {
        return true;
    }

    setParentView(parentView?: IParentView): void {
    }
}

