
export class PostEmitter {
    constructor() {
        this.map = {}
    }

    /**
     * @param {number} id
     */
    done(id){
        if (this.map[id]){
            this.emit(id)
        }else{
            this.map[id] = {done:true,list:[]}
        }
    }

    /**
     *
     * @param {number} id
     * @param {function(): void} runnable
     */
    run(id,runnable){
        this.push(id,runnable)
    }

    /**
     * @private
     * @param id
     * @param runnable
     */
    push(id,runnable){
        if (this.map[id]){
            let block = this.map[id]
            if (block.done){
                runnable()
            }else{
                block.list.push(runnable)
            }
        }else{
            this.map[id] = {done:false,list:[runnable]}
        }
    }

    /**
     * @private
     * @param {number} id
     */
    emit(id){

        let block = this.map[id]
        block.done = true

        for (let i = 0; i < block.list.length; i++) {
            block.list[i]()
        }
        block.list = []
    }

}

