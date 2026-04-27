import {ILiveManager} from "@casperui/core/live/ILiveManager";
import {LiveManager} from "@casperui/core/live/LiveManager";

export type ObserverCallback<T> = (value: T,caller:any) => void

export class LiveData<T> {
    protected mValue: T
    private mCaller: any = null
    protected mObservers: Map<WeakRef<LiveManager>, WeakRef<ObserverCallback<T>>> = new Map();
    protected mPublishHistory = new Map();

    constructor(initialValue: T) {
        this.mValue = initialValue;
    }

    getCaller(): any {
        return this.mCaller
    }
    getValue() {
        return this.mValue;
    }
    getOriginalValue(){
        return this.mValue
    }


    update(){
        this.clearPublishHistory();
        this.notifyObservers();
    }
    pushValueToArray(item: T,caller:any = null) {
        if (Array.isArray(this.mValue)) {
            this.mCaller = caller
            this.mValue.push(item)
            this.clearPublishHistory();
            this.notifyObservers();
            this.mCaller = null
        }
    }

    setValue(newValue: T,caller:any = null) {
        this.mCaller = caller
        this.mValue = newValue;
        this.clearPublishHistory();
        this.notifyObservers();
        this.mCaller = null
    }

    setIfChanged(newValue: T,caller:any = null) {
        if (newValue!=this.mValue){
            this.mCaller = caller
            this.mValue = newValue;
            this.clearPublishHistory();
            this.notifyObservers();
            this.mCaller = null
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
            callback(this.getValue(),null);
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
                    cb(this.getValue(),this.mCaller);
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
                    cb(this.getValue(),this.mCaller);
                    this.mPublishHistory.set(callback, true);
                }

            }
        });

    }

    clearPublishHistory() {
        this.mPublishHistory.clear();
    }
}