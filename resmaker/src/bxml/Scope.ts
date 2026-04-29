
const RESERVED = new Set([
    "c", "i", "l", "t", "do", "if", "in", "as", "of", "for", "let", "new", "try", "var",
    "case", "else", "enum", "null", "this", "true", "void", "with",
    "await", "break", "catch", "class", "const", "false", "super",
    "throw", "while", "yield", "delete", "export", "import", "return",
    "static", "switch", "typeof", "default", "extends", "finally",
    "function", "interface", "continue", "instanceof", "implements"
])
function mapToObject(node: Map<string, string>): any {
    let ret = [] as string[];

    node.forEach((value, key, map) => {
        ret.push(`${key}:${value}`)
    })
    return `{${ret.join(",\n")}}`
}
function mapToInterface(node: Map<string, string>): any {
    let ret = [] as string[];

    node.forEach((value, key, map) => {
        ret.push(`${key}:View`)
    })
    return `{${ret.join(",\n")}}`
}
export class Scope {
    code:string[] = []
    private varIndex = 0
    private constVars = new Map<string, string>();
    private constVarsLines: string[] = []
    private interfaceMap = new Map<string, string>()
    private idMap = new Map<string, string>()

    scopes = [] as Scope[]
    parentScope: Scope | null = null
    private mainInterfaceName: string = "";
    constructor(public functionName: string) {

    }

    getChildInterfaceByName(name: string): any {
        for (let i = 0; i < this.scopes.length; i++) {
            let scope = this.scopes[i]
            if (scope.functionName == name) {
                return scope.getInterfaceBody()
            }
        }
        return "View"
    }

    getInterfaceBody():string {
        let ret = [] as string[];

        this.interfaceMap.forEach((value, key, map) => {

            let out = this.getChildInterfaceByName(this.idMap.get(key)!)
            if (out !="View") {
                out =` () => ${out}`
            }
            ret.push(`${key}:${out}`)
        })
        let outInt = ""
        if (this.mainInterfaceName.length > 0) {
            outInt += `export interface ${this.mainInterfaceName}`
        }
        return `${outInt}{${ret.join("\n")}}`
    }
    getAllInterfaces(){

    }

    setId(id: string,name: string,type:string = "View"): void {
        this.idMap.set(id,name);
        this.interfaceMap.set(id, type);

    }
    setMainInterfaceName(name: string): void {
        this.mainInterfaceName = name;
    }

    getTagVariable(tag: string): string {

        if (tag === "template") tag = "div"
        if (this.parentScope){
            return this.parentScope.getTagVariable(tag)
        }
        if (!this.constVars.has(tag)) {
            let varName = this.nextVar()
            this.constVars.set(tag, varName)
            this.constVarsLines.push(`let ${varName}="${tag}"`)
        }
        return this.constVars.get(tag)!
    }

    nextVar(): string {

        if (this.parentScope){
            return this.parentScope.nextVar()
        }
        let name: string
        do {
            let n = ""
            let x = ++this.varIndex
            while (x > 0) {
                x--
                n = String.fromCharCode(97 + (x % 26)) + n
                x = Math.floor(x / 26)
            }
            name = n
        } while (RESERVED.has(name))
        return name
    }
    addCode(code: string) {
        this.code.push(code)
    }
    getNextScope(functionName: string):Scope {
        let scope = new Scope(functionName)
        scope.parentScope = this
        this.scopes.push(scope)
        return scope
    }

    makeCode(params:string="",inject:string=""):string {
        let out = this.constVarsLines.join("\n")
        let outInt = ""
        if (this.mainInterfaceName.length > 0) {
            outInt += `:${this.mainInterfaceName}`
        }
        out+=`\nlet ${this.functionName} = function (${params})${outInt} {${inject}\n${this.code.join("\n")}\nreturn ${mapToObject(this.idMap)}}`
        return out
    }
    getMainCode(params:string="",inject:string=""){
            let out =""
            let outInt = ""
            if (this.mainInterfaceName.length > 0) {
                outInt += `:${this.mainInterfaceName}`
            }
            out+=`\nexport function ${this.functionName}(${params})${outInt} {${this.constVarsLines.join("\n")}\n${inject}\n${this.code.join("\n")}\nreturn ${mapToObject(this.idMap)}}`
            return out
    }
}