import {LiveData} from "@casperui/core/live/LiveData";
import {ILiveManager} from "@casperui/core/live/ILiveManager";


interface ValueObject<T> {
    config:T
    key:string|null,
    oldValue:any|null,
    newValue:any|null
    caller:any
}
export class LiveDataConfig<T> extends LiveData<ValueObject<T>> {

    constructor(initialValue:T) {
        super({config: initialValue,key:null,oldValue:null,newValue:null} as ValueObject<T>);
    }

    resetValue(newValue:T){
        super.setValue({config: newValue,key:null,oldValue:null,newValue:null} as ValueObject<T>)
    }

    setValue(newValue:ValueObject<T>) {
        return new Error("use reset value")
    }


    observe(observer: ILiveManager, callback: (value: ValueObject<T>) => void) {
        super.observe(observer, callback);
    }

    /**
     * Изменение значения по ключу с сохранением старого и нового значений
     * @param {string} key - имя изменённого ключа
     * @param {any} newValue - новое значение ключа
     * @param {object?} caller
     */
    updateAttribute(key:string, newValue:any, caller?:any) {
        const oldValue = this.value.config[key]; // Старое значение
        if (oldValue !== newValue) {
            this.value.config[key] = newValue;
            this.value.key = key;
            this.value.caller = caller;
            this.value.oldValue = oldValue
            this.value.newValue = newValue
            this.clearPublishHistory()
            this.notifyObservers()
        }
    }

    updateObject(object:T,caller:any) {
        this.value.oldValue = Object.assign({},this.value.config)
        this.value.config = object;
        this.value.key = null;
        this.value.caller = caller;
        this.value.newValue = object
        this.clearPublishHistory()
        this.notifyObservers()

    }


}
