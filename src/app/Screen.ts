import {JFragment} from "@casperui/core/app/JFragment";
import {Context} from "@casperui/core/content/Context";
import {View} from "@casperui/core/view/View";

export type LayoutBind = { root: View }

export type ScreenCtor<B extends LayoutBind> = new (context: Context) => JFragment & { readonly bind: B }

export function Screen<B extends LayoutBind>(inflate: (ctx: Context) => B): ScreenCtor<B> {
    class LayoutScreen extends JFragment {
        readonly bind: B

        constructor(context: Context) {
            super(context)
            this.bind = inflate(this.ctx())
        }

        onCreateView(): View {
            return this.bind.root
        }
    }

    return LayoutScreen
}
