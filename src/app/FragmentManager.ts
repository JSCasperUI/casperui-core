
import {IFragmentManager} from "@casperui/core/app/IFragmentManager";
import {JFragment} from "@casperui/core/app/JFragment";
import {IParentView, View} from "@casperui/core/view/View";

export class FragmentManager {
    mManager:IFragmentManager
    isAttached:boolean

    constructor(manager:IFragmentManager, isRoot = false) {
        this.mManager = manager
        this.isAttached = false
    }

    attachFragmentManager() {
        if (this.isAttached) return
        this.isAttached = true
        this.activateAttachFragmentManager()

    }

    detachFragmentManager() {
        if (!this.isAttached) return
        this.isAttached = false
        this.deactivateAttachFragmentManager()
    }


    deactivateAttachFragmentManager() {
        if (this.isAttached) return

        let memory = this.mManager.getFragmentMemory()

        memory.forEach((fr, id) => {
            let fragment = fr//.deref()
            if (fragment) {
                fragment.detachFragment()
            }
        });


    }

    activateAttachFragmentManager() {
        if (!this.isAttached) return

        let memory = this.mManager.getFragmentMemory()
        memory.forEach((fr, id) => {
            let fragment = fr//.deref()
            if (fragment) {
                fragment.attach()
            }
        })
    }



    replaceFragment(containerId:number, fragment:JFragment, container:View|null = null) {
        if (!fragment) return;
        let oldFragment = null
        let memory = this.mManager.getFragmentMemory()

        if (memory.has(containerId)) {
            oldFragment = memory.get(containerId)//.deref()
            if (!oldFragment) {
                oldFragment = null
            }
        }
        // memory.set(containerId,new WeakRef(fragment))
        memory.set(containerId, fragment)
        if (oldFragment != null && oldFragment === fragment) {
            return
        }
        if (!container) {
            container = this.mManager.getView().byId(containerId)
        }

        if (oldFragment != null) {
            oldFragment.detachFragment()
            container.removeView(oldFragment.getFragmentView())
        }
        if (!fragment.isFragmentCreated()) {
            fragment.startCreatingView()
            fragment.onCreated()
        }

        container.addView(fragment.getView());
        fragment.getView().setParentView(this.mManager as unknown as IParentView)
        fragment.setParentFrame(new WeakRef(this.mManager))
        if (this.isAttached) {
            fragment.attach()
        }
    }

    pushFragment(containerId:number, fragment:JFragment, container:View|null = null) {
        if (!fragment) return;
        let memory = this.mManager.getFragmentMemory()

        if (memory.has(containerId)) {
            return;
        }


        // memory.set(containerId,new WeakRef(fragment))
        memory.set(containerId, fragment)

        if (!container) {
            container = this.mManager.getView().byId(containerId)
        }

        if (!fragment.isFragmentCreated()) {
            fragment.startCreatingView()
            fragment.onCreated()
        }
        // fragment.getFragmentView().id = containerId

        container.addView(fragment.getView());
        fragment.getView().setParentView(this.mManager as unknown as IParentView)
        fragment.setParentFrame(new WeakRef(this.mManager))
        if (this.isAttached) {
            fragment.attach()
        }
    }




    getIdByFragment(fragment:JFragment):number {
        let memory = this.mManager.getFragmentMemory()
        for (let [key, value] of memory) {
            if (value === fragment) {
                return key
            }
        }
        return -1
    }



    dropFragment(fragmentOld:JFragment, container:View|null = null) {
        let memory = this.mManager.getFragmentMemory()
        let containerId = this.getIdByFragment(fragmentOld)
        if (memory.has(containerId)) {
            let oldFragment = memory.get(containerId)//.deref()
            memory.delete(containerId)
            oldFragment.detachFragment()
            if (!container) {
                container = this.mManager.getView().byId(containerId)
            }
            container.removeView(oldFragment.getView())
        }
    }


    swapInContainer(oldFragment:JFragment, newFragment:JFragment, container:View|null = null) {
        let memory = this.mManager.getFragmentMemory()

        let oldView = oldFragment.getView()
        let index = container.indexView(oldView)

        if (index >= 0) {
            oldFragment.detachFragment()

            container.removeView(oldView)
            container.addView(newFragment.getView(), index)
            newFragment.getView().setParentView(this.mManager as unknown as IParentView)
            newFragment.attach()
        }


    }

}
