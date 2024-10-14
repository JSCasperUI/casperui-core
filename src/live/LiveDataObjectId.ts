import {LiveData} from "@casperui/core/live/LiveData";


export class LiveDataObjectId<T> extends LiveData<T> {
    idHashMap:Record<string, any>;
    constructor(initialValue:T) {
        super(initialValue);
        this.idHashMap = {};
    }

    pushValueToArray(item) {
        if (Array.isArray(this.value)) {
            this.value.push(item)
            this.idHashMap[item._id] = this.value.length - 1
            this.clearPublishHistory()
            this.notifyObservers();

        }
    }

    updateIdMap() {
        this.idHashMap = {};

        if (Array.isArray(this.value)) {
            for (let i = 0; i < this.value.length; i++) {
                this.idHashMap[this.value[i]._id] = i
            }
        }
    }

    setValue(newValue:T) {
        if (this.value !== newValue) {
            this.value = newValue;
            if (this.value != null && Array.isArray(this.value)) {
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
        return this.value[this.idHashMap[id]]
    }
}