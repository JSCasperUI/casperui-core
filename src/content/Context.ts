import {Resources} from "@casperui/core/content/Resources";


export abstract class Context {
    abstract getResources():Resources
    abstract getApplicationContext():Context

}
