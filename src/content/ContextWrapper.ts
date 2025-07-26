import {Context} from "@casperui/core/content/Context";
import {Resources} from "@casperui/core/content/Resources";
import {BXMLInflater} from "@casperui/core/view/inflater/BXMLInflater";


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

    getInflater(): BXMLInflater {
        return this.mBase.getInflater();
    }

}


