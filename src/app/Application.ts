import {ContextWrapper} from "@casperui/core/content/ContextWrapper";
import {Context} from "@casperui/core/content/Context";
import {BinaryResources} from "@casperui/core/content/BinaryResources";
import {Resources} from "@casperui/core/content/Resources";
import {Activity} from "@casperui/core/app/Activity";


export class Application  extends ContextWrapper {
    private mainActivity:Activity
    private mApplicationContext:Context
    private mResources:Resources


    constructor() {
        super();

        this.mainActivity = undefined
        this.mApplicationContext = new ContextWrapper()
        this.mResources = new BinaryResources()

        // WidgetRegistrar.
        this.attachBaseContext(this.mApplicationContext)
    }



    getResources():Resources {
        return this.mResources;
    }

    getApplicationContext() {
        return this;
    }
    async readExtendedResources(){
        let out = await new Promise(function ( resolve, reject){
            let xhr = new XMLHttpRequest()
            xhr.withCredentials = true
            xhr.responseType = "arraybuffer"
            xhr.open("GET", "/res.html");
            xhr.onload = function (){
                resolve(xhr.response)
            }
            xhr.send(null);
        });
        console.log(out);
        (this.mResources as BinaryResources).initResources(out as ArrayBuffer)
    }

    async startActivity(activity:Activity){
        await this.readExtendedResources()
        this.mainActivity = activity
        this.mainActivity.attachBaseContext(this)
        this.mainActivity.create()

    }

    addNewFontFace(){

    }
}
