

export interface BXNode {
    tag:string;
    isText:boolean;
    children:Array<BXNode>;
    attrs:Record<string, string|number>|null
}