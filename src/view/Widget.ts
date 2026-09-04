import {Context} from "@casperui/core/content/Context";
import {View, ViewTag} from "@casperui/core/view/View";
import {ViewAttributes} from "@casperui/core/view/ViewAttributes";

export type WidgetBind = { root: View }

export type WidgetCtor<B extends WidgetBind> = new (
    context: Context,
    tag?: ViewTag,
    attr?: ViewAttributes
) => View & { readonly bind: B }

export function Widget<B extends WidgetBind>(inflate: (ctx: Context) => B): WidgetCtor<B> {
    class LayoutWidget extends View {
        readonly bind: B

        constructor(context: Context, tag?: ViewTag, attr?: ViewAttributes) {
            const bind = inflate(context)
            super(context, bind.root.getElement(), attr)
            this.bind = bind
            this.adoptTree(bind.root)
        }

        private contentSlot(): View | null {
            const content = (this.bind as WidgetBind & { content?: View }).content
            if (!content || content.getElement() === this.getElement()) return null
            return content
        }

        addView(view: View, index?: number) {
            const slot = this.contentSlot()
            if (slot) {
                slot.addView(view, index)
                return this
            }
            return super.addView(view, index)
        }

        removeView(view: View) {
            const slot = this.contentSlot()
            if (slot && slot.hasView(view)) {
                slot.removeView(view)
                return this
            }
            return super.removeView(view)
        }

        hasView(view: View): boolean {
            const slot = this.contentSlot()
            if (slot && slot.hasView(view)) return true
            return super.hasView(view)
        }

        indexView(view: View) {
            const slot = this.contentSlot()
            if (slot && slot.hasView(view)) return slot.indexView(view)
            return super.indexView(view)
        }
    }

    return LayoutWidget
}
