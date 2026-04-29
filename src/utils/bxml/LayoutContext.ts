import {View} from "@casperui/core/view/View";
import {BinaryAttributePair} from "@casperui/core/utils/bxml/BinaryAttributePair";
import {Context} from "@casperui/core/content/Context";
import {WidgetRegistrar} from "@casperui/core/view/inflater/WidgetRegistrar";
import {ViewNode} from "@casperui/core/view/nodes/ViewNode";
import {NodeType} from "@casperui/core/view/nodes/NodeType";
import {EMPTY_STRING} from "@casperui/core/space/Constants";

type LayContext = [
    c: (t: string, y: number) => View,
    t: (t: number) => View,
    l: (t: number) => View,
    i: () => View,
];

export function _getLayCTX(ctx: Context, layoutId: number): LayContext {
    let res = ctx.getResources()
    let bin = new BinaryAttributePair(res.getBufferById(layoutId), res)
    const createView = (t: string, y: number) => {
        return WidgetRegistrar.createInstance(t, ctx, t, bin.getAttribute(y))
    }
    const createTextViewByValue = (y: number) => {
        return new ViewNode(NodeType.TEXT, bin.getValue(y) as string) as View
    }
    const createTextViewByLangId = (y: number) => {
        return new ViewNode(NodeType.TEXT, res.getString(y) as string) as View
    }
    const identifierText = () => {
        return new ViewNode(NodeType.TEXT, EMPTY_STRING) as View
    }
    return [createView, createTextViewByValue, createTextViewByLangId, identifierText]
}