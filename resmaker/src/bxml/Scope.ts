
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
    node.forEach((value, key) => {
        ret.push(`${key}:${value}`)
    })
    return `{${ret.join(",\n")}}`
}

type DirectiveType = ':text' | ':bind' | ':if' | ':hidden' | ':else'

interface SimpleBinding {
    varName: string
    directive: DirectiveType
    stateKey: string
}

interface ItemBinding {
    id: string
    expr: string
    directive: DirectiveType
}

interface ForBinding {
    containerVar: string
    stateKey: string      // "sites" = top-level state, "site.items" = nested (outer item field)
    itemVar: string
    templateId: string
    keyField: string | null
    itemBindings: ItemBinding[]
    itemEvents: ItemEvent[]
}

interface SimpleEvent {
    varName: string
    eventName: string
    handlerKey: string
}

interface ItemEvent {
    id: string
    eventName: string
    handlerKey: string
}

function toJsExpr(expr: string): string {
    return expr.replace(/!==|===|!=|==/g, m => m === '==' ? '===' : m === '!=' ? '!==' : m)
}

function eventToMethod(eventName: string): string {
    switch (eventName) {
        case 'click':     return 'setOnClickListener'
        case 'dblclick':  return 'onDoubleClick'
        case 'mouseover': return 'onMouseOver'
        case 'mouseout':  return 'onMouseOut'
        default:          return `vEvent.bind(null,'${eventName}')`
    }
}

function buildItemLines(itemBindings: ItemBinding[], eventLines: string[], itemVar: string, prefix = '_r'): string[] {
    const lines: string[] = []
    for (const ib of itemBindings) {
        const jsExpr = toJsExpr(ib.expr)
        switch (ib.directive) {
            case ':text':   lines.push(`${prefix}.${ib.id}.setText(${jsExpr})`); break
            case ':bind':   lines.push(`${prefix}.${ib.id}.setValue(${jsExpr})`); break
            case ':if':     lines.push(`${prefix}.${ib.id}.setVisibility(${jsExpr})`); break
            case ':hidden': lines.push(`${prefix}.${ib.id}.setVisibility(!(${jsExpr}))`); break
            case ':else':   lines.push(`${prefix}.${ib.id}.setVisibility(!(${jsExpr}))`); break
        }
    }
    lines.push(...eventLines)
    return lines
}

export class Scope {
    code: string[] = []
    private varIndex = 0
    private constVars = new Map<string, string>();
    private constVarsLines: string[] = []
    private interfaceMap = new Map<string, string>()
    private idMap = new Map<string, string>()

    scopes = [] as Scope[]
    parentScope: Scope | null = null
    private mainInterfaceName: string = "";

    private simpleBindings: SimpleBinding[] = []
    private forBindings: ForBinding[] = []
    private simpleEvents: SimpleEvent[] = []

    constructor(public functionName: string) {}

    addDirective(varName: string, directive: string, stateKey: string) {
        this.simpleBindings.push({ varName, directive: directive as DirectiveType, stateKey })
    }

    addEvent(varName: string, eventName: string, handlerKey: string) {
        this.simpleEvents.push({ varName, eventName, handlerKey })
    }

    addForBinding(containerVar: string, stateKey: string, itemVar: string, templateId: string, keyField: string | null, itemBindings: ItemBinding[], itemEvents: ItemEvent[]) {
        this.forBindings.push({ containerVar, stateKey, itemVar, templateId, keyField, itemBindings, itemEvents })
    }

    private isNested(b: ForBinding): boolean {
        return b.stateKey.includes('.')
    }

    private hasBindings(): boolean {
        return this.simpleBindings.length > 0
            || this.forBindings.some(b => !this.isNested(b))
            || this.simpleEvents.length > 0
    }

    // Собирает outer item params нужные для вложенных for-биндингов в child scope
    private getTemplateOuterParams(templateVar: string): string {
        const childScope = this.scopes.find(s => s.functionName === templateVar)
        if (!childScope) return ''
        const outerVars = new Set<string>()
        for (const fb of childScope.forBindings) {
            if (childScope.isNested(fb)) {
                outerVars.add(fb.stateKey.split('.')[0])
            }
        }
        return [...outerVars].join(',')
    }

    // Генерирует inline bindList для вложенных циклов (stateKey вида "site.items")
    private getNestedForCode(): string {
        const lines: string[] = []
        for (const b of this.forBindings) {
            if (!this.isNested(b)) continue
            const templateVar = this.idMap.get(b.templateId) || b.templateId
            const keyArg = b.keyField ? `,${b.itemVar}=>${b.itemVar}.${b.keyField}` : ''
            const outerParams = this.getTemplateOuterParams(templateVar)
            const eventLines = b.itemEvents.map(e =>
                `_r.${e.id}.${eventToMethod(e.eventName)}(()=>${b.itemVar}_handler.${e.handlerKey}(${b.itemVar}))`
            )
            const itemLines = buildItemLines(b.itemBindings, eventLines, b.itemVar)
            lines.push(
                `${b.containerVar}.bindList(${b.stateKey},(${b.itemVar})=>{`,
                `const _r=${templateVar}(${outerParams})`,
                ...itemLines,
                `return _r.root`,
                `}${keyArg})`
            )
        }
        return lines.join('\n')
    }

    // Собирает outer item params для этого scope (для сигнатуры makeCode)
    private getOwnOuterParams(): string {
        const outerVars = new Set<string>()
        for (const b of this.forBindings) {
            if (this.isNested(b)) {
                outerVars.add(b.stateKey.split('.')[0])
            }
        }
        return [...outerVars].join(',')
    }

    private getStateKeys(): Map<string, string> {
        const keys = new Map<string, string>()
        for (const b of this.simpleBindings) {
            const type = (b.directive === ':if' || b.directive === ':hidden' || b.directive === ':else')
                ? 'LiveData<boolean>'
                : 'LiveData<string>'
            keys.set(b.stateKey, type)
        }
        for (const b of this.forBindings) {
            if (this.isNested(b)) continue  // вложенные не идут в state
            keys.set(b.stateKey, 'LiveData<any[]> | any[]')
            for (const e of b.itemEvents) {
                keys.set(e.handlerKey, '(item: any) => void')
            }
        }
        for (const e of this.simpleEvents) {
            keys.set(e.handlerKey, '() => void')
        }
        return keys
    }

    private getStateInterfaceName(): string {
        return this.mainInterfaceName + 'State'
    }

    private getStateInterfaceBody(): string {
        const keys = this.getStateKeys()
        const fields: string[] = []
        keys.forEach((type, key) => fields.push(`    ${key}: ${type}`))
        return `export interface ${this.getStateInterfaceName()} {\n${fields.join('\n')}\n}`
    }

    private directiveToMethod(d: DirectiveType): string {
        switch (d) {
            case ':text':   return 'bindText'
            case ':bind':   return 'bindInputValue'
            case ':if':     return 'bindVisible'
            case ':hidden': return 'bindHidden'
            case ':else':   return 'bindHidden'
        }
    }

    private getBindBody(): string {
        const lines: string[] = []

        for (const b of this.simpleBindings) {
            lines.push(`${b.varName}.${this.directiveToMethod(b.directive)}(state.${b.stateKey})`)
        }

        for (const b of this.forBindings) {
            if (this.isNested(b)) continue  // вложенные генерируются в makeCode
            const templateVar = this.idMap.get(b.templateId) || b.templateId
            const keyArg = b.keyField ? `,${b.itemVar}=>${b.itemVar}.${b.keyField}` : ''
            const outerParams = this.getTemplateOuterParams(templateVar)
            const eventLines = b.itemEvents.map(e =>
                `_r.${e.id}.${eventToMethod(e.eventName)}(()=>state.${e.handlerKey}(${b.itemVar}))`
            )
            const itemLines = buildItemLines(b.itemBindings, eventLines, b.itemVar)
            const srcVar = `_${b.stateKey.replace('.', '_')}`
            lines.push(`const ${srcVar}=state.${b.stateKey} instanceof LiveData?state.${b.stateKey}:new LiveData(state.${b.stateKey})`)
            lines.push(
                `${b.containerVar}.bindList(${srcVar},(${b.itemVar})=>{`,
                `const _r=${templateVar}(${outerParams})`,
                ...itemLines,
                `return _r.root`,
                `}${keyArg})`
            )
        }

        for (const e of this.simpleEvents) {
            lines.push(`${e.varName}.${eventToMethod(e.eventName)}(()=>state.${e.handlerKey}())`)
        }

        return `bind(state:${this.getStateInterfaceName()}){${lines.join('\n')}}`
    }

    private getReturnObject(): string {
        const parts: string[] = []
        this.idMap.forEach((value, key) => parts.push(`${key}:${value}`))
        if (this.mainInterfaceName.length > 0 && this.hasBindings()) {
            parts.push(this.getBindBody())
        }
        return `{${parts.join(',\n')}}`
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

    getInterfaceBody(): string {
        let ret = [] as string[];

        this.interfaceMap.forEach((value, key) => {
            let out = this.getChildInterfaceByName(this.idMap.get(key)!)
            if (out != "View") {
                out = ` () => ${out}`
            }
            ret.push(`${key}:${out}`)
        })

        if (this.mainInterfaceName.length > 0 && this.hasBindings()) {
            ret.push(`bind(state: ${this.getStateInterfaceName()}): void`)
        }

        let outInt = ""
        if (this.mainInterfaceName.length > 0) {
            const stateInterface = this.hasBindings() ? this.getStateInterfaceBody() + "\n" : ""
            outInt += `${stateInterface}export interface ${this.mainInterfaceName}`
        }
        return `${outInt}{${ret.join("\n")}}`
    }

    setId(id: string, name: string, type: string = "View"): void {
        this.idMap.set(id, name);
        this.interfaceMap.set(id, type);
    }

    setMainInterfaceName(name: string): void {
        this.mainInterfaceName = name;
    }

    getTagVariable(tag: string): string {
        if (tag === "template") tag = "div"
        if (this.parentScope) {
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
        if (this.parentScope) {
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

    getNextScope(functionName: string): Scope {
        let scope = new Scope(functionName)
        scope.parentScope = this
        this.scopes.push(scope)
        return scope
    }

    makeCode(params: string = "", inject: string = ""): string {
        const nestedForCode = this.getNestedForCode()
        const outerParams = this.getOwnOuterParams()
        const allParams = [params, outerParams].filter(Boolean).join(',')

        let out = this.constVarsLines.join("\n")
        let outInt = ""
        if (this.mainInterfaceName.length > 0) {
            outInt += `:${this.mainInterfaceName}`
        }
        out += `\nlet ${this.functionName} = function(${allParams})${outInt} {${inject}\n${this.code.join("\n")}\n${nestedForCode}\nreturn ${this.getReturnObject()}}`
        return out
    }

    getMainCode(params: string = "", inject: string = "") {
        let out = ""
        let outInt = ""
        if (this.mainInterfaceName.length > 0) {
            outInt += `:${this.mainInterfaceName}`
        }
        out += `\nexport function ${this.functionName}(${params})${outInt} {${this.constVarsLines.join("\n")}\n${inject}\n${this.code.join("\n")}\nreturn ${this.getReturnObject()}}`
        return out
    }
}
