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
    getFileName(){
        return this.function_name+".ts";
    }


    addSelectByIdPath(varName: string, path: number[], type: string = "View") {
        this.autoBinds.push({name: varName, type: type, path: path}); // или запиши куда нужно
    }




     getAutoBindScript(): string {
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
            if (bind.path.length>0){
                lines.push(`\t\t${bind.name}: v.byPath(${pathStr}),`);
            }else{
                lines.push(`\t\t${bind.name}: v,`);
            }
        }
        lines.push(`\t};`);
        lines.push(`}`);


         //3.
         lines.push(`export function ${this.function_name}_i(x:${this.interface_name},v: View):void {`);
         for (const bind of this.autoBinds) {
             const pathStr = `[${bind.path.join(',')}]`;
             if (bind.path.length>0){
                 lines.push(`\tx.${bind.name} = v.byPath(${pathStr})`);
             }else{
                 lines.push(`\tx.${bind.name} = v`);
             }

         }
         lines.push(`}`);

        return lines.join('\n');
    }

}