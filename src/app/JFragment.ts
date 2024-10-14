import {ILiveManager} from "@casperui/core/live/ILiveManager";
import {Context} from "@casperui/core/content/Context";
import {LiveManager} from "@casperui/core/live/LiveManager";
import {createFragmentMemory, FragmentMemory, IFragmentManager} from "@casperui/core/app/IFragmentManager";
import {FragmentManager} from "@casperui/core/app/FragmentManager";
import {Activity} from "@casperui/core/app/Activity";
import {View} from "@casperui/core/view/View";
import {BXMLInflater} from "@casperui/core/view/inflater/BXMLInflater";


export abstract class JFragment implements ILiveManager,IFragmentManager {
    fragmentMemory = createFragmentMemory();
    liveManager = new LiveManager();
    fragmentManager = new FragmentManager(this)


    mBaseView:View
    mContext:Context
    mIsAttached = false
    mParent:WeakRef<JFragment> = null

    isSingleAttached = false


    constructor(context:Context) {


        this.mBaseView = null;
        this.mContext = context

    }
    getContext(){
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


    getParent():JFragment|null{
        if (this.mParent){
            return this.mParent.deref()
        }
        return null
    }

    getActivity(){
        return this.mContext as Activity
    }

    attach(){

            // if (!this.isSingleAttached){
            //     this.isSingleAttached = true
            //     this.onAttachSingle()
            // }
            // this.onAttach()

            this.getFragmentManager().attachFragmentManager()
            this.mIsAttached = true
            this.liveManager.activate()

        if (!this.isSingleAttached){
            this.isSingleAttached = true
            this.onAttachSingle()
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

    detach(){
        this.mIsAttached = false
        this.getFragmentManager().detachFragmentManager()
        this.onDetach()
        this.liveManager.deactivate()
    }

    protected onAttach(){

    }

    protected onAttachSingle(){

    }



    protected onDetach(){

    }

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
        if (this.mBaseView.id === id){
            return this.mBaseView
        }
        return this.mBaseView.byId(id)
    }

    onCreated(){

    }


    getFragmentMemory(): FragmentMemory {
        return this.fragmentMemory;
    }

    innerBinders: any;
}

