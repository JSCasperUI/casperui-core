import path from "node:path";
import fs from "fs";

let rootResourceDirectory = process.cwd()


export interface ResourceConfig {

    resourceDir?: string, // default res
    output?: {
        id?: string,//"./src/R.ts",
        binaryFile?: string,//"./assets/res.html",
        cssFile?: string,//"./assets/app.css",
    },
    widget?: {
        name: string,// Resource widget name
    }
    sub_resources?: string[]


    isPrimaryResource:boolean;
    rootDirectory?: string;
    resources: ResourceConfig[]
}

const defaultConfig = {
    resourceDir: "./res",
    output: {
        id: "./src/R.ts",
        binaryFile: "./assets/resources.bin",
        cssFile: "./assets/style.css",
    }
}

function def(value: string | undefined, def: string): string {
    if (value === undefined) {
        return def;
    }
    return value;
}

 function readResourceConfigSelf(directory: string): ResourceConfig|null {
    let config: ResourceConfig = {
        sub_resources: [],
        resources: [],
        isPrimaryResource:false
    }
    const configPath = path.join(directory, "./resconfig.json");
    if (fs.existsSync(configPath)) {
        config = Object.assign(config, JSON.parse(fs.readFileSync(configPath, "utf-8")))
        config.resourceDir = path.join(directory, def(config.resourceDir, defaultConfig.resourceDir));
        if (!config.output) {
            config.output = {}
        }
        config.output.id = path.join(directory, def(config.output.id, defaultConfig.output.id))
        if (config.output.binaryFile){
            config.output.binaryFile = path.join(directory, config.output.binaryFile)
        }
        if (config.output.cssFile){
            config.output.cssFile = path.join(directory, config.output.cssFile)
        }
        config.rootDirectory = directory

    } else return null

    let resources = []
    if (config.sub_resources) {
        for (let i = 0; i < config.sub_resources.length; i++) {
            let out = readResourceConfigSelf(path.join(directory, config.sub_resources[i]))
            if (out) resources.push(out)
        }
    }

    config.resources = resources

    return config
}

let inlineArray = function (config: ResourceConfig, result: ResourceConfig[]) {
    if (config.resources) {
        for (let i = 0; i < config.resources.length; i++) {
            inlineArray(config.resources[i], result)
        }
        // delete config.resources
    }
    result.push(config)

}

export function configArray(dir: string) {
    let config = readResourceConfigSelf(dir)
    let configs: ResourceConfig[] = []
    let cssPath = null
    if (config?.output?.cssFile) {
        cssPath = config?.output?.cssFile
    }
    inlineArray(config!, configs)
    config!.isPrimaryResource = true
    return {configs: configs, rootResourceFile: config?.output?.binaryFile, style_file: cssPath}
}

