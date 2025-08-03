import {XNode} from "@rMaker/xml/XMLTree";
import {parseTemplate} from "@rMaker/xml/var";
import {DYNAMIC_TYPE} from "@rMaker/bxml/Dictionary";

export function transformTextNodes(nodes: XNode[]): XNode[] {
    const result: XNode[] = [];

    for (const node of nodes) {
        if (node.tag === "#text") {
            const parsed = parseTemplate(node.textContent);

            const newTextNodes: XNode[] = parsed.map(token => {
                let type = 0;
                if (token.type === "var") {
                    type = DYNAMIC_TYPE.IDENTIFIER;
                } else if (token.type === "lang") {
                    type = DYNAMIC_TYPE.LANG_ID;
                }

                return {
                    tag: "#text",
                    isText: true,
                    type,
                    textContent: token.type === "text" ? token.value : token.key,
                    attrs: {},
                    childNodes: [],
                    line: node.line
                };
            });

            result.push(...newTextNodes);
        } else {
            // Рекурсивно обрабатываем дочерние узлы
            const newNode: XNode = {
                ...node,
                childNodes: transformTextNodes(node.childNodes)
            };
            result.push(newNode);
        }
    }

    return result;
}
