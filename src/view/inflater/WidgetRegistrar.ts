import {Context} from "@casperui/core/content/Context";
import {ViewAttributes} from "@casperui/core/view/ViewAttributes";
import {View} from "@casperui/core/view/View";
type ViewConstructor = (context: Context, tag: string, attributes: ViewAttributes) => View;

const classMap:Record<string, ViewConstructor> = {}

export const WidgetRegistrar = {

    register:function (className:string,constructor:ViewConstructor){
        classMap[className] = constructor;
    },

    createInstance:function (className:string,context:Context,tag:string,attributes:ViewAttributes) {
        if (classMap[className]) {
            return classMap[className](context,tag,attributes)
        }
        return new View(context,tag,attributes)
    }
}
