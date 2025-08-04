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
import {ContextWrapper} from "@casperui/core/content/ContextWrapper";

export type FragmentResizeHandler = (newWidth:number, newHeight:number) => void;


export abstract class JFragment extends ContextWrapper implements ILiveManager, IFragmentManager,IParentView {

    static readonly POST_A_ATTACHED = 1;
    static readonly POST_A_DETACHED = 2;
    static readonly POST_ATTACH = 3;
    static readonly POST_DETACH = 4;


    private fragmentMemory = createFragmentMemory();
    private liveManager = new LiveManager();
    private fragmentManager = new FragmentManager(this)

    private resizeObserver:ResizeObserver = null
    private baseView:View
    private isAttached = false
    private parent:WeakRef<JFragment> = null
    private isSingleAttached = false

    private postActions = new PostAction<number>()

    private attachEventListeners = []

    constructor(context:Context) {
        super()
        if (context instanceof Activity) {
            this.attachBaseContext(context)
        }else if (context instanceof JFragment) {
            this.attachBaseContext(context.getBaseContext())
        }
        this.baseView = null;

    }
    ctx():Context{
        return this.getBaseContext()
    }


    getLiveManager(){
        return this.liveManager;
    }


    getFragmentManager(){
        return this.fragmentManager
    }


    abstract onCreateView(inflater:BXMLInflater,container:View):View


    setParentFrame(parent){
        this.parent = parent

    }

    getParentFragment():JFragment|null{
        if (this.parent){
            return this.parent.deref()
        }
        return null
    }

    getContext():Context{
        return this.getBaseContext();
    }

    getActivity():Activity{
        return this.getBaseContext() as Activity
    }

    postAttach(func:any){
        this.postActions.run(JFragment.POST_A_ATTACHED,func)
    }
    getPostActions():PostAction<number>{
        return this.postActions;
    }

    attach(){

        this.getFragmentManager().attachFragmentManager()
        this.isAttached = true
        this.liveManager.activate()

        if (!this.isSingleAttached){
            this.isSingleAttached = true
            this.onAttachSingle()
            this.postActions.doneAction(JFragment.POST_A_ATTACHED)
        }
        this.onAttach()
        this.postActions.doneAction(JFragment.POST_ATTACH)
        this.attachEventListeners.forEach(listener=>listener())

    }
    addAttachEventListener(listener:any){
        this.attachEventListeners.push(listener)
    }

    isFragmentAttached(){
        return this.isAttached
    }

    detachFragment(){
        this.isAttached = false
        this.getFragmentManager().detachFragmentManager()
        this.onDetach()
        this.liveManager.deactivate()
        this.postActions.doneAction(JFragment.POST_DETACH)
    }

    protected onAttach(){}
    protected onAttachSingle(){}
    protected onDetach(){}
    onCreated():void{}

    isFragmentCreated(){
        return this.baseView != null
    }

    startCreatingView(){
        this.baseView = this.onCreateView(this.getActivity().getLayoutInflater(), null)

    }

    getView():View{
        return this.baseView
    }

    byIds(ids:number[]):View[]{
        let out = []
        for (let i = 0; i < ids.length; i++) {
            out.push(this.byId(ids[i]))
        }
        return out
    }

    byId<T extends View = View>(id: number): T {
        if (this.baseView.getId() === id) {
            return this.baseView as T;
        }
        return this.baseView.byId(id) as T;
    }





    getFragmentMemory(): FragmentMemory {
        return this.fragmentMemory;
    }

    innerBinders: any;

    onSizeChangeListener(handler:FragmentResizeHandler){
        if (this.resizeObserver){
            this.resizeObserver.disconnect()
        }
        this.resizeObserver = new ResizeObserver(entries => {
            if (this.isFragmentAttached())
                handler(entries[0].contentRect.width,entries[0].contentRect.height)
        })
        this.resizeObserver.observe(this.getView().getElement());
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

