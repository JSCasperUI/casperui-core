import {ILiveManager} from "@casperui/core/live/ILiveManager";
import {Context} from "@casperui/core/content/Context";
import {LiveManager} from "@casperui/core/live/LiveManager";
import {createFragmentMemory, FragmentMemory, IFragmentManager} from "@casperui/core/app/IFragmentManager";
import {FragmentManager} from "@casperui/core/app/FragmentManager";
import {Activity} from "@casperui/core/app/Activity";
import {View} from "@casperui/core/view/View";
import {BXMLInflater} from "@casperui/core/view/inflater/BXMLInflater";
import {ViewAttributes} from "@casperui/core/view/ViewAttributes";
import {PostAction} from "@casperui/core/space/PostAction";

export type FragmentResizeHandler = (newWidth:number, newHeight:number) => void;


export abstract class JFragment implements ILiveManager, IFragmentManager {

    static readonly POST_A_ATTACHED = 1;


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
        // requestAnimationFrame(()=>{
        //     if (!this.isSingleAttached){
        //         this.isSingleAttached = true
        //         this.onAttachSingle()
        //     }
        //     this.onAttach()
        //
        //     this.getFragmentManager().attachFragmentManager()
        //     this.mIsAttached = true
        //     this.liveManager.activate()
        // })
    }

    isAttached(){
        return this.mIsAttached
    }

    detachFragment(){
        this.mIsAttached = false
        this.getFragmentManager().detachFragmentManager()
        this.onDetach()
        this.liveManager.deactivate()
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
            handler(entries[0].contentRect.width,entries[0].contentRect.height)
        })
        this.mResizeObserver.observe(this.getFragmentView().getElement());
    }
}

