import {IFragmentManager} from "@casperui/core/app/IFragmentManager";
import {JFragment} from "@casperui/core/app/JFragment";
import {IParentView, View} from "@casperui/core/view/View";

export class FragmentManager {
    private isAttached: boolean

    constructor(public manager: IFragmentManager, isRoot = false) {
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

        let memory = this.manager.getFragmentMemory()

        memory.forEach((fr, id) => {
            let fragment = fr//.deref()
            if (fragment) {
                fragment.detachFragment()
            }
        });


    }

    activateAttachFragmentManager() {
        if (!this.isAttached) return

        let memory = this.manager.getFragmentMemory()
        memory.forEach((fr, id) => {
            let fragment = fr//.deref()
            if (fragment) {
                fragment.attach()
            }
        })
    }


    replaceFragment(containerId: number, fragment: JFragment, container: View | null = null) {
        if (!fragment) return;

        let oldFragment: JFragment | null = null;
        const memory = this.manager.getFragmentMemory();

        if (memory.has(containerId)) {
            oldFragment = memory.get(containerId) ?? null;
        }

        if (oldFragment !== null && oldFragment === fragment) {
            return;
        }

        memory.set(containerId, fragment);

        if (!container) {
            container = this.manager.getView().byId(containerId);
        }

        if (oldFragment !== null) {
            oldFragment.detachFragment();
            container.removeView(oldFragment.getView());
        }

        if (!fragment.isFragmentCreated()) {
            fragment.startCreatingView();

            // Важно: root-view должен знать свой fragment до onCreated()
            fragment.getView().setParentView(fragment as unknown as IParentView);

            fragment.onCreated();
        }

        container.addView(fragment.getView());

        // Важно: addView перезапишет parentView на container,
        // поэтому возвращаем owner обратно на fragment.
        fragment.getView().setParentView(fragment as unknown as IParentView);

        fragment.setParentFragment(new WeakRef(this.manager as unknown as JFragment));

        if (this.isAttached) {
            fragment.attach();
        }
    }

    pushFragment(containerId: number, fragment: JFragment, container: View | null = null) {
        if (!fragment) return;

        const memory = this.manager.getFragmentMemory();

        if (memory.has(containerId)) {
            return;
        }

        memory.set(containerId, fragment);

        if (!container) {
            container = this.manager.getView().byId(containerId);
        }

        if (!fragment.isFragmentCreated()) {
            fragment.startCreatingView();

            fragment.getView().setParentView(fragment as unknown as IParentView);

            fragment.onCreated();
        }

        container.addView(fragment.getView());

        fragment.getView().setParentView(fragment as unknown as IParentView);

        fragment.setParentFragment(new WeakRef(this.manager as unknown as JFragment));

        if (this.isAttached) {
            fragment.attach();
        }
    }


    getIdByFragment(fragment: JFragment): number {
        let memory = this.manager.getFragmentMemory()
        for (let [key, value] of memory) {
            if (value === fragment) {
                return key
            }
        }
        return -1
    }


    dropFragment(fragmentOld: JFragment, container: View | null = null) {
        let memory = this.manager.getFragmentMemory()
        let containerId = this.getIdByFragment(fragmentOld)
        if (memory.has(containerId)) {
            let oldFragment = memory.get(containerId)//.deref()
            memory.delete(containerId)
            oldFragment.detachFragment()
            if (!container) {
                container = this.manager.getView().byId(containerId)
            }
            container.removeView(oldFragment.getView())
        }
    }


    swapInContainer(oldFragment: JFragment, newFragment: JFragment, container: View | null = null) {
        if (!container) return;

        const oldView = oldFragment.getView();
        const index = container.indexView(oldView);

        if (index < 0) return;

        oldFragment.detachFragment();

        if (!newFragment.isFragmentCreated()) {
            newFragment.startCreatingView();
            newFragment.getView().setParentView(newFragment as unknown as IParentView);
            newFragment.onCreated();
        }

        container.removeView(oldView);
        container.addView(newFragment.getView(), index);

        newFragment.getView().setParentView(newFragment as unknown as IParentView);
        newFragment.setParentFragment(new WeakRef(this.manager as unknown as JFragment));

        if (this.isAttached) {
            newFragment.attach();
        }
    }

}
