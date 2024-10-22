import {ILiveManager} from "@casperui/core/live/ILiveManager";
import {LiveManager} from "@casperui/core/live/LiveManager";



export class LiveData<T> {
    value:T
    observers = new Map();
    publishHistory = new Map();
    constructor(initialValue:T) {
        this.value = initialValue;
    }

    getValue() {
        return this.value;
    }

    pushValueToArray(item:T) {
        if (Array.isArray(this.value)) {
            this.value.push(item)
            this.clearPublishHistory();
            this.notifyObservers();
        }
    }




    setValue(newValue:T) {
            this.value = newValue;
            this.clearPublishHistory(); // Сбрасываем историю публикаций при изменении
            this.notifyObservers();
    }


    observe(observer:ILiveManager, callback: (value: T) => void) {
        if (!observer.innerBinders){
            observer.innerBinders = []
        }
        callback = callback.bind(observer)
        observer.innerBinders.push(callback)
        let lm = observer.getLiveManager()
        let rfa = new WeakRef(lm);
        let cbRef = new WeakRef(callback);

        this.observers.set(rfa, cbRef);

        if (lm) {
            lm.registerLiveData(this);
        }
        if (lm.isActive) {
            callback(this.value);
            this.publishHistory.set(cbRef, true);
        }
    }

    removeObserver(observer) {
        // this.observers.delete(observer);
        throw new Error("Need ")
    }

    notifyObservers() {
        this.observers.forEach((callback, mObserver) => {
            let ref = mObserver.deref()
            let cb = callback.deref()
            if (!ref || !cb) {
                this.observers.delete(mObserver)
            } else {
                if (ref.isActive && !this.publishHistory.get(callback)) {
                    cb(this.value);
                    this.publishHistory.set(callback, true);
                }
            }

        });
    }

    notifyObserver(observer:LiveManager) {
        this.observers.forEach((callback, mObserver) => {
            if (mObserver.deref() === observer) {
                let cb = callback.deref()
                if (cb && !this.publishHistory.get(callback)) {
                    cb(this.value);
                    this.publishHistory.set(callback, true);
                }

            }
        });

    }
    clearPublishHistory() {
        this.publishHistory.clear();
    }
}