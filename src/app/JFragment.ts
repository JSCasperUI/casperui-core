import {ILiveManager} from "@casperui/core/live/ILiveManager";
import {Context} from "@casperui/core/content/Context";
import {LiveManager} from "@casperui/core/live/LiveManager";
import {createFragmentMemory, FragmentMemory, IFragmentManager} from "@casperui/core/app/IFragmentManager";
import {FragmentManager} from "@casperui/core/app/FragmentManager";
import {Activity} from "@casperui/core/app/Activity";
import {IParentView, View} from "@casperui/core/view/View";
import {BXMLInflater} from "@casperui/core/view/inflater/BXMLInflater";
import {ViewAttributes} from "@casperui/core/view/ViewAttributes";
import {PostAction} from "@casperui/core/space/PostAction";

export type FragmentResizeHandler = (newWidth:number, newHeight:number) => void;


export abstract class JFragment implements ILiveManager, IFragmentManager,IParentView {

    static readonly POST_A_ATTACHED = 1;
    static readonly POST_A_DETACHED = 2;
    static readonly POST_ATTACH = 3;
    static readonly POST_DETACH = 4;


    private fragmentMemory = createFragmentMemory();
    private liveManager = new LiveManager();
    private fragmentManager = new FragmentManager(this)

    private mResizeObserver:ResizeObserver = null
    private mBaseView:View
    mContext:Context
    private mIsAttached = false
    private mParent:WeakRef<JFragment> = null
    private isSingleAttached = false

    private mPostActions = new PostAction<number>()


    private mAttachEventListeners = []
    constructor(context:Context) {
        this.mBaseView = null;
        this.mContext = context

    }
    ctx(){
        return this.mContext
    }


    getLiveManager(){
        return this.liveManager;
    }


    getFragmentManager(){
        return this.fragmentManager
    }


    abstract onCreateView(inflater:BXMLInflater,container:View):View


    setParentFrame(parent){
        this.mParent = parent

    }



    getParentFragment():JFragment|null{
        if (this.mParent){
            return this.mParent.deref()
        }
        return null
    }

    getActivity(){
        return this.mContext as Activity
    }

    postAttach(func:any){
        this.mPostActions.run(JFragment.POST_A_ATTACHED,func)
    }
    getPostActions():PostAction<number>{
        return this.mPostActions;
    }

    attach(){


        this.getFragmentManager().attachFragmentManager()
        this.mIsAttached = true
        this.liveManager.activate()

        if (!this.isSingleAttached){
            this.isSingleAttached = true
            this.onAttachSingle()
            this.mPostActions.doneAction(JFragment.POST_A_ATTACHED)
        }
        this.onAttach()
        this.mPostActions.doneAction(JFragment.POST_ATTACH)
        this.mAttachEventListeners.forEach(listener=>listener())

    }
    addAttachEventListener(listener:any){
        this.mAttachEventListeners.push(listener)
    }

    isAttached(){
        return this.mIsAttached
    }

    detachFragment(){
        this.mIsAttached = false
        this.getFragmentManager().detachFragmentManager()
        this.onDetach()
        this.liveManager.deactivate()
        this.mPostActions.doneAction(JFragment.POST_DETACH)
    }

    protected onAttach(){}
    protected onAttachSingle(){}
    protected onDetach(){}
    onCreated():void{}

    isFragmentCreated(){
        return this.mBaseView != null
    }

    startCreatingView(){
        this.mBaseView = this.onCreateView(this.getActivity().getLayoutInflater(), null)

    }


    getFragmentView():View{
        return this.mBaseView
    }

    byIds(ids:number[]):View[]{
        let out = []
        for (let i = 0; i < ids.length; i++) {
            out.push(this.byId(ids[i]))
        }
        return out
    }

    byId(id:number):View{
        if (this.mBaseView.getId() === id){
            return this.mBaseView
        }
        return this.mBaseView.byId(id)
    }




    getFragmentMemory(): FragmentMemory {
        return this.fragmentMemory;
    }

    innerBinders: any;

    onSizeChangeListener(handler:FragmentResizeHandler){
        if (this.mResizeObserver){
            this.mResizeObserver.disconnect()
        }
        this.mResizeObserver = new ResizeObserver(entries => {
            if (this.isAttached())
                handler(entries[0].contentRect.width,entries[0].contentRect.height)
        })
        this.mResizeObserver.observe(this.getFragmentView().getElement());
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

