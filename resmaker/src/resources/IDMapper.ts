export class IDMapper {
    listIdName: string[] = []
    constructor(private resourceName: string,private indexOffset: number = 0) {
    }


    has(name: string): boolean {
        return this.listIdName.indexOf(name) >= 0
    }
    getLastIndex():number {
        return this.listIdName.length -1
    }
    getIdByName(name:string):number {
        let idx = this.listIdName.indexOf(name)
        if (idx >= 0) {
            return idx
        }
        this.listIdName.push(name)
        return (this.listIdName.length -1)+this.indexOffset
    }
    toStringMap(): string {
        const lines = this.listIdName.map((name, index) => `  ${name}: ${index+this.indexOffset},`);
        return `${this.resourceName}: {\n${lines.join("\n")}\n}`;
    }
}


