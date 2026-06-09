import {ILiveManager} from "@casperui/core/live/ILiveManager";
import {LiveManager} from "@casperui/core/live/LiveManager";

export type ObserverCallback<T> = (value: T,caller:any) => void

export class LiveData<T> {
    protected mValue: T
    private mCaller: any = null
    protected mObservers: Map<WeakRef<LiveManager>, WeakRef<ObserverCallback<T>>> = new Map();
    protected mPublishHistory = new Map();
    private mRawObservers: Set<ObserverCallback<T>> = new Set();

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

    removeObserver(observer: ILiveManager) {
        const lm = observer.getLiveManager();

        this.mObservers.forEach((callback, mObserver) => {
            const ref = mObserver.deref();

            if (!ref || ref === lm) {
                this.mObservers.delete(mObserver);
                this.mPublishHistory.delete(callback);
            }
        });
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
        this.mRawObservers.forEach(cb => cb(this.getValue(), this.mCaller))


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

    observeRaw(callback: ObserverCallback<T>) {
        callback(this.getValue(), null)
        this.mRawObservers.add(callback)
    }

    removeRawObserver(callback: ObserverCallback<T>) {
        this.mRawObservers.delete(callback)
    }

    map<R>(fn: (value: T) => R): ComputedLiveData<R> {
        return new ComputedLiveData([this], (v) => fn(v))
    }

    clearPublishHistory() {
        this.mPublishHistory.clear();
    }
}

export class ComputedLiveData<T> extends LiveData<T> {
    private readonly mSources: LiveData<any>[]
    private readonly mRawCallbacks: ObserverCallback<any>[]

    constructor(sources: LiveData<any>[], compute: (...values: any[]) => T) {
        super(compute(...sources.map(s => s.getValue())))
        this.mSources = sources
        this.mRawCallbacks = sources.map((source, i) => {
            const cb: ObserverCallback<any> = () => {
                super.setValue(compute(...this.mSources.map(s => s.getValue())))
            }
            source.observeRaw(cb)
            return cb
        })
    }

    dispose() {
        this.mSources.forEach((source, i) => source.removeRawObserver(this.mRawCallbacks[i]))
    }
}

export function computed<T>(sources: LiveData<any>[], fn: (...values: any[]) => T): ComputedLiveData<T> {
    return new ComputedLiveData(sources, fn)
}