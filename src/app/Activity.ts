import {ILiveManager} from "@casperui/core/live/ILiveManager";
import {createFragmentMemory, FragmentMemory, IFragmentManager} from "@casperui/core/app/IFragmentManager";
import {FragmentManager} from "@casperui/core/app/FragmentManager";
import {ContextWrapper} from "@casperui/core/content/ContextWrapper";
import {LiveManager} from "@casperui/core/live/LiveManager";
import {IParentView, View} from "@casperui/core/view/View";
import {BXMLInflater} from "@casperui/core/view/inflater/BXMLInflater";


export class Activity extends ContextWrapper implements ILiveManager, IFragmentManager, IParentView {
    private mLiveManager:LiveManager
    private mFragmentMemory:FragmentMemory
    private mFragmentManager:FragmentManager
    private mWindow:View
    private mRoot:View
    private mInflater:BXMLInflater
    constructor() {
        super();
        this.mLiveManager = new LiveManager();
        this.mFragmentMemory = createFragmentMemory()
        this.mFragmentManager = new FragmentManager(this,true)
        this.mRoot = new View(this,document.body)
        this.mWindow = new View(this,document.body)
        this.mInflater = new BXMLInflater(this)
    }

    getInflater(): BXMLInflater {
        return this.mInflater
    }

    getLiveManager(){
        return this.mLiveManager;
    }

    getRootView():View{
        return this.mRoot
    }

    getWindowView():View{
        return this.mWindow
    }

    createActivity(){
        this.onCreate()
        this.mFragmentManager.attachFragmentManager()
        this.mLiveManager.activate()
    }
    onCreate(){

    }
    onLayout(){
    }

    byId(id:number):View{
        return this.mRoot.byId(id)
    }


    getLayoutInflater():BXMLInflater{
        return this.mInflater
    }


    setContentView(layoutId:number){
        (this.mRoot.mNode as HTMLElement).innerHTML = "";
        this.mInflater.inflate(layoutId,false,this.mRoot);
        this.onLayout()
    }



    getFragmentView():View{
        return this.mRoot
    }

    getFragmentMemory(): FragmentMemory {
        return this.mFragmentMemory
    }

    getFragmentManager(): FragmentManager {
        return this.mFragmentManager;
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

