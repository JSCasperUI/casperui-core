import {Resources} from "@casperui/core/content/Resources";
import {BXMLInflater} from "@casperui/core/view/inflater/BXMLInflater";

export abstract class Context {
    abstract getResources():Resources
    abstract getApplicationContext():Context
    abstract getInflater():BXMLInflater

}
