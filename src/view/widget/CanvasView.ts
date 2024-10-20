import {View} from "@casperui/core/view/View";
import {Context} from "@casperui/core/content/Context";
import {ViewAttributes} from "@casperui/core/view/ViewAttributes";


class CanvasView extends View {
    constructor(context:Context,tag?:string|Element,attr?:ViewAttributes) {
        super(context,"canvas",attr);

    }



}