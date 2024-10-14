import {ILiveManager} from "@casperui/core/live/ILiveManager";
import {createFragmentMemory, FragmentMemory, IFragmentManager} from "@casperui/core/app/IFragmentManager";
import {FragmentManager} from "@casperui/core/app/FragmentManager";
import {ContextWrapper} from "@casperui/core/content/ContextWrapper";
import {LiveManager} from "@casperui/core/live/LiveManager";
import {View} from "@casperui/core/view/View";
import {BXMLInflater} from "@casperui/core/view/inflater/BXMLInflater";


export class Activity extends ContextWrapper implements ILiveManager,IFragmentManager {
    private liveManager:LiveManager
    private fragmentMemory:FragmentMemory
    private fragmentManager:FragmentManager
    private mWindow:View
    private root:View
    private inflater:BXMLInflater
    constructor() {
        super();
        this.liveManager = new LiveManager();
        this.fragmentMemory = createFragmentMemory()
        this.fragmentManager = new FragmentManager(this,true)
        this.root = new View(this,document.body)
        this.mWindow = new View(this,document.body)
        this.inflater = new BXMLInflater(this)
    }

    getInflater(): BXMLInflater {
        return this.inflater
    }

    getLiveManager(){
        return this.liveManager;
    }


    getWindowView():View{
        return this.mWindow
    }

    create(){
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
        (this.root.node as HTMLElement).innerHTML = "";
        this.inflater.inflate(layoutId,false,this.root);
        this.onLayout()
    }



    getFragmentView():View{
        return this.root
    }

    getFragmentMemory(): FragmentMemory {
        return this.fragmentMemory
    }

    getFragmentManager(): FragmentManager {
        return this.fragmentManager;
    }

    innerBinders: any;
}

