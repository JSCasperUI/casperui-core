import {Context} from "@casperui/core/content/Context";
import {Resources} from "@casperui/core/content/Resources";



export class ContextWrapper extends Context {
    private mBase:Context

    constructor() {
        super();
        this.mBase = null
    }


    getBaseContext(): Context {
        return this.mBase;
    }
    attachBaseContext(context:Context){
        this.mBase = context
    }


    getResources():Resources {
        return this.mBase.getResources()
    }


    getApplicationContext():Context {
        return this.mBase.getApplicationContext()
    }


}


