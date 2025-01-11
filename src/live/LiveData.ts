import {ILiveManager} from "@casperui/core/live/ILiveManager";
import {LiveManager} from "@casperui/core/live/LiveManager";

export type ObserverCallback<T> = (value: T) => void

export class LiveData<T> {
    protected mValue: T
    protected mObservers: Map<WeakRef<LiveManager>, WeakRef<ObserverCallback<T>>> = new Map();
    protected mPublishHistory = new Map();

    constructor(initialValue: T) {
        this.mValue = initialValue;
    }

    getValue() {
        return this.mValue;
    }

    pushValueToArray(item: T) {
        if (Array.isArray(this.mValue)) {
            this.mValue.push(item)
            this.clearPublishHistory();
            this.notifyObservers();
        }
    }

    setValue(newValue: T) {
        this.mValue = newValue;
        this.clearPublishHistory();
        this.notifyObservers();
    }

    setIfChanged(newValue: T) {
        if (newValue!=this.mValue){
            this.mValue = newValue;
            this.clearPublishHistory();
            this.notifyObservers();
        }
    }


    observe(observer: ILiveManager, callback: ObserverCallback<T>) {
        if (!observer.innerBinders) {
            observer.innerBinders = []
        }
        callback = callback.bind(observer)
        observer.innerBinders.push(callback)
        let lm = observer.getLiveManager()
        let rfa = new WeakRef(lm);
        let cbRef = new WeakRef(callback);

        this.mObservers.set(rfa, cbRef);

        if (lm) {
            lm.registerLiveData(this);
        }
        if (lm.hasActive()) {
            callback(this.mValue);
            this.mPublishHistory.set(cbRef, true);
        }
    }

    removeObserver(observer) {
        // this.observers.delete(observer);
        throw new Error("Need ")
    }

    notifyObservers() {
        this.mObservers.forEach((callback, mObserver) => {
            let ref = mObserver.deref()
            let cb = callback.deref()
            if (!ref || !cb) {
                this.mObservers.delete(mObserver)
            } else {
                if (ref.hasActive() && !this.mPublishHistory.get(callback)) {
                    cb(this.mValue);
                    this.mPublishHistory.set(callback, true);
                }
            }

        });
    }

    notifyObserver(observer: LiveManager) {
        this.mObservers.forEach((callback, mObserver) => {
            if (mObserver.deref() === observer) {
                let cb = callback.deref()
                if (cb && !this.mPublishHistory.get(callback)) {
                    cb(this.mValue);
                    this.mPublishHistory.set(callback, true);
                }

            }
        });

    }

    clearPublishHistory() {
        this.mPublishHistory.clear();
    }
}