import {htmlTagsMap} from "@rMaker/utils/consts";
import {XNode} from "@rMaker/xml/XMLTree";

export function generateSnakeBindingName(filePath: string): string {
    const parts = filePath.replace(/\\/g, '/').split('/');

    const layoutIndex = parts.findIndex(p => p.toLowerCase() === "layout");
    if (layoutIndex === -1 || layoutIndex >= parts.length - 1) {
        throw new Error("Путь должен содержать layout/...");
    }

    const relativeParts = parts.slice(layoutIndex+1);
    const fileName = relativeParts.at(-1)!;
    const fileBase = fileName.replace(/\.[^.]+$/, ''); // без .html

    const pathParts = [...relativeParts.slice(0, -1), fileBase];

    return `bind_${pathParts.join('_')}`;
}

export function generatePascalBindingName(filePath: string): string {
    const parts = filePath.replace(/\\/g, '/').split('/');

    const layoutIndex = parts.findIndex(p => p.toLowerCase() === "layout");
    if (layoutIndex === -1 || layoutIndex >= parts.length - 1) {
        throw new Error("Путь должен содержать layout/...");
    }

    const relativeParts = parts.slice(layoutIndex + 1);
    const fileName = relativeParts.at(-1)!;
    const fileBase = fileName.replace(/\.[^.]+$/, '');

    // PascalCase для имени файла с учётом _ и -
    const pascal = fileBase
        .split(/[_\-]/)
        .map(p => p.charAt(0).toUpperCase() + p.slice(1))
        .join('');

    // Аббревиатура из папок с учётом _ и -
    const abbr = relativeParts
        .slice(0, -1)
        .reverse()
        .map(d => d.split(/[_\-]/).map(w => w[0].toUpperCase()+ w.slice(1)).join(''))
        .join('');

    return `I${pascal}${abbr}`;
}




export function convertTagToLowerCase(tag:string) {
    const lowerCaseTag = tag.toLowerCase();
    if (htmlTagsMap.has(lowerCaseTag)) {
        return lowerCaseTag;
    }
    return tag;
}
const identifier_rx = /^[A-Za-z_][A-Za-z0-9_]*$/

export function checkIdentifier(name:string) {
    if (name.length === 0){
        return false;
    }
    return identifier_rx.test(name)
}
export function bakePathTree(root: XNode) {
    const stack: number[] = [];

    function visit(node: XNode, depth: number) {
        node.__path = stack.slice(0, depth);
        for (let i = 0; i < node.childNodes.length; i++) {
            stack[depth] = i;
            visit(node.childNodes[i], depth + 1);
        }
    }

    visit(root, 0);
}