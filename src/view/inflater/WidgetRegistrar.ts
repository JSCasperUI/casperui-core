import {Context} from "@casperui/core/content/Context";
import {ViewAttributes} from "@casperui/core/view/ViewAttributes";
import {View} from "@casperui/core/view/View";
export type ViewConstructor = (context: Context, tag: string, attributes: ViewAttributes) => View;

const classMap: Record<string, ViewConstructor> = Object.create(null);

export const WidgetRegistrar = {
    register(className: string, constructor: ViewConstructor): void {
        classMap[className] = constructor;
    },

    createInstance(className: string, context: Context, tag: string, attributes: ViewAttributes): View {
        const ctor = classMap[className];
        return ctor !== undefined
            ? ctor(context, tag, attributes)
            : new View(context, tag, attributes);
    }
};
