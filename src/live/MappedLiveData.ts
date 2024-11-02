import {ArrayToObjectID} from "@casperui/core/space/utils";
import {LiveData, ObserverCallback} from "@casperui/core/live/LiveData";
import {ILiveManager} from "@casperui/core/live/ILiveManager";
import {LiveManager} from "@casperui/core/live/LiveManager";

export class MappedLiveData<T> extends LiveData<any> {

    mapField:string
    mappedValue:Record<string, any>
    constructor(initialValue:T, mapField:string) {
        super(initialValue);
        this.mapField = mapField
        this.mObservers = new Map();
        this.mappedValue = {}
        this.mValue = null;
        this.setValue(initialValue)

    }

    getValue() {
        return this.mValue;
    }

    pushValueToArray(item:any) {
        super.pushValueToArray(item)
    }

    setValue(newValue) {
        this.mappedValue = ArrayToObjectID(newValue, this.mapField)
        super.setValue(newValue)
    }



}