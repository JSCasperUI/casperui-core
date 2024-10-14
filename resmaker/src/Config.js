const path = require("node:path");
const fs = require("fs");
let rootResourceDirectory = process.cwd()


const readResourceConfig = (directory)=> {
    let config = {
        resources:[]
    }
    const configPath = path.join(directory,"./resconfig.json");
    if (fs.existsSync(configPath)){
        config = Object.assign(config,JSON.parse(fs.readFileSync(configPath,"utf-8")))

        config.resource_folder  = path.join(directory,config.resource_folder);
        config.id_file          = path.join(directory,config.id_file);
        if (config.resource_file){
            config.resource_file    = path.join(directory,config.resource_file);
        }
        config.rootDir          = directory
    }else return null
    let resources = []
    for (let i = 0; i < config.resources.length; i++) {
        let out = readResourceConfig(path.join(directory,config.resources[i]))
        if (out) resources.push(out)


    }
    config.resources = resources

    return config
}
let inlineArray = function (config,result){
    if (config.resources){
        for (let i = 0; i < config.resources.length; i++) {
            inlineArray(config.resources[i],result)
        }
        delete config.resources
    }
    result.push(config)

}

let configArray = function (dir){
    let config = readResourceConfig(dir)
    let configs = []
    let cssPath = null
    if (config.style_file){
        cssPath = config.style_file
    }
    inlineArray(config, configs)
    return {configs:configs,rootResourceFile:config.resource_file,style_file:cssPath}
}

module.exports.readResourceConfig = configArray