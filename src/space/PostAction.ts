interface RunBlock{done:boolean,list:any[]}
export class PostAction<T> {
    private mMap:Map<T,RunBlock>

    doneAction(name:T){
        if (!this.mMap) this.mMap = new Map()
        if (this.mMap.has(name))
            this.emitFunctions(name)
        else
            this.mMap.set(name, {done:true,list:[]})
    }
    run(name:T, func:any){
        if (!this.mMap) this.mMap = new Map()
        this.pushFunction(name,func)
    }

    private emitFunctions(name:T){
        if (this.mMap.has(name)){
            let block = this.mMap.get(name)
            block.done = true
            for (let i = 0; i < block.list.length; i++) {
                block.list[i]();
            }
            block.list = []
        }

    }

    private pushFunction(name:T,func:any){
        if (this.mMap.has(name)){
            let block = this.mMap.get(name)
            if (block.done){
                func()
            }else{
                block.list.push(func)
            }
        }else{
            this.mMap.set(name, {done:false,list:[func]})
        }
    }
}