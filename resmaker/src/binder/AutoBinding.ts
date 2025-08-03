import {generatePascalBindingName, generateSnakeBindingName} from "@rMaker/utils/utils";


export interface BindItem {
    name: string,
    type: string,
    path: number[]
}


//interface BindFragmentServerInfo {
// 	is_pvp:View
// 	is_pve:View
// 	is_rp:View
// }
//
// function bind_fragments_server_info(_v:View):BindFragmentServerInfo{
// 	return {
// 		is_pvp	:_v.byPath([0,2,1,4]),
// 		is_pve	:_v.byPath([0,2,1,4]),
// 		is_rp	:_v.byPath([0,2,1,4]),
// 	}
// }

export interface AutoBindingResult {
    path:string,
    code:string
}

export class AutoBinding {
    private interface_name:string
    private function_name:string
    private autoBinds: BindItem[] = [];

    constructor(filePath:string) {
        this.interface_name = generatePascalBindingName(filePath)
        this.function_name = generateSnakeBindingName(filePath)
    }

    makeResult(idFilePath?:string):AutoBindingResult {
        return {
            path:this.getFilePath(idFilePath),
            code:this.getAutoBindScript()
        }
    }
    addSelectByIdPath(varName: string, path: number[], type: string = "View") {
        this.autoBinds.push({name: varName, type: type, path: path}); // или запиши куда нужно
    }

    private getFilePath(idFilePath?:string):string {
        return ""
    }


    private getAutoBindScript(): string {
        const lines: string[] = [];

        // 1. Интерфейс
        lines.push(`export interface ${this.interface_name} {`);
        for (const bind of this.autoBinds) {
            lines.push(`\t${bind.name}: ${bind.type}`);
        }
        lines.push(`}`);
        lines.push('');

        // 2. Функция биндинга
        lines.push(`export function ${this.function_name}(v: View): ${this.interface_name} {`);
        lines.push(`\treturn {`);
        for (const bind of this.autoBinds) {
            const pathStr = `[${bind.path.join(',')}]`;
            lines.push(`\t\t${bind.name}: v.byPath(${pathStr}) as ${bind.type},`);
        }
        lines.push(`\t};`);
        lines.push(`}`);

        return lines.join('\n');
    }

}