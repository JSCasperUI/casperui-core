import {ILiveManager} from "@casperui/core/live/ILiveManager";
import {createFragmentMemory, FragmentMemory, IFragmentManager} from "@casperui/core/app/IFragmentManager";
import {FragmentManager} from "@casperui/core/app/FragmentManager";
import {ContextWrapper} from "@casperui/core/content/ContextWrapper";
import {LiveManager} from "@casperui/core/live/LiveManager";
import {IParentView, View} from "@casperui/core/view/View";
import {BXMLInflater} from "@casperui/core/view/inflater/BXMLInflater";
import {JFragment} from "@casperui/core/app/JFragment";


export class Activity extends ContextWrapper implements ILiveManager, IFragmentManager, IParentView {

    private liveManager: LiveManager = new LiveManager();
    private fragmentMemory: FragmentMemory = createFragmentMemory()
    private fragmentManager: FragmentManager
    private windowView: View
    private inflater: BXMLInflater
    innerBinders: any;


    constructor() {
        super();
        this.fragmentManager = new FragmentManager(this, true)
        this.windowView = new View(this, document.body)
        this.inflater = new BXMLInflater(this)
    }

    getInflater(): BXMLInflater {
        return this.inflater
    }

    getLiveManager() {
        return this.liveManager;
    }



    getWindowView(): View {
        return this.windowView
    }

    createActivity() {
        this.onCreate()
        this.fragmentManager.attachFragmentManager()
        this.liveManager.activate()
    }

    onCreate() {}

    onLayout() {}

    byId(id: number): View {
        return this.windowView.byId(id)
    }

    byPath(path: number[]): View | null {
        return this.windowView.byPath(path)
    }

    getLayoutInflater(): BXMLInflater {
        return this.inflater
    }

    setContentView(layoutId: number) {
        (this.windowView.mNode as HTMLElement).innerHTML = "";
        this.windowView.addView(this.inflater.inflate(layoutId, false));
        this.onLayout()
    }

    addAttachEventListener(listener: any) {
        listener()
    }

    getView(): View {
        return this.windowView
    }

    getFragmentMemory(): FragmentMemory {
        return this.fragmentMemory
    }

    replaceFragment(id:number, fragment:JFragment){
        this.fragmentManager.replaceFragment(id, fragment)
    }
    getFragmentManager(): FragmentManager {
        return this.fragmentManager;
    }

    getParentView(): IParentView | null {
        return this;
    }

    isFragmentView(): boolean {
        return true;
    }

    setParentView(parentView?: IParentView): void {
    }
}

