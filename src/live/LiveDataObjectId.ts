import {LiveData} from "@casperui/core/live/LiveData";


export class LiveDataObjectId<T> extends LiveData<T> {
    idHashMap:Record<string, any>;
    constructor(initialValue:T) {
        super(initialValue);
        this.idHashMap = {};
    }

    pushValueToArray(item) {
        if (Array.isArray(this.mValue)) {
            this.mValue.push(item)
            this.idHashMap[item._id] = this.mValue.length - 1
            this.clearPublishHistory()
            this.notifyObservers();

        }
    }

    updateIdMap() {
        this.idHashMap = {};

        if (Array.isArray(this.mValue)) {
            for (let i = 0; i < this.mValue.length; i++) {
                this.idHashMap[this.mValue[i]._id] = i
            }
        }
    }

    setValue(newValue:T) {
        if (this.mValue !== newValue) {
            this.mValue = newValue;
            if (this.mValue != null && Array.isArray(this.mValue)) {
                this.updateIdMap()
            }
            this.clearPublishHistory()
            this.notifyObservers();
        }
    }


    getValueIndexById(id:string) {
        return this.idHashMap[id]
    }

    getValueByObjectId(id:string) {
        return this.mValue[this.idHashMap[id]]
    }
}