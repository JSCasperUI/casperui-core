import {ArrayToObjectID} from "@casperui/core/space/utils";
import {LiveData} from "@casperui/core/live/LiveData";
import {ILiveManager} from "@casperui/core/live/ILiveManager";
import {LiveManager} from "@casperui/core/live/LiveManager";

export class MappedLiveData<T> extends LiveData<any> {

    mapField:string
    mappedValue:Record<string, any>
    constructor(initialValue:T, mapField:string) {
        super(initialValue);
        this.mapField = mapField
        this.observers = new Map();
        this.mappedValue = {}
        this.value = null;
        this.setValue(initialValue)

    }

    getValue() {
        return this.value;
    }

    pushValueToArray(item:any) {
        super.pushValueToArray(item)
    }

    setValue(newValue) {
        this.mappedValue = ArrayToObjectID(newValue, this.mapField)
        super.setValue(newValue)
    }


    observe(observer: ILiveManager, callback: (value: any) => void) {
            this.observers.set(observer, callback);
            const liveManager = observer.getLiveManager();
            if (liveManager) {
                liveManager.registerLiveData(this);
            }
            if (liveManager.isActive) {
                callback(this.value); // Notify immediately with the current value
            }
    }

    removeObserver(observer:ILiveManager) {
        this.observers.delete(observer);
    }

    notifyObservers() {
        this.observers.forEach((callback, observer) => {
            if (observer.getLiveManager().isActive) {
                callback(this.value);
            }
        });
    }

}