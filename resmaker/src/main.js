#!/usr/bin/env node

const {ResourceMaker} = require("./resources/ResourceMaker");
const {watchDirectory} = require("./FileWatcher");
const fs= require("fs");
const path = require("node:path");
const {readResourceConfig} = require("./Config");

console.log("=== CasperUI ResourceMaker ===");
console.log("This tool scans and packs resources into a binary file.");
console.log("");
console.log("Usage:");
console.log("  resmaker --watch --include_path");
console.log("  (or define everything in a config file in your project folder)");
console.log("");

function parseArgs(argv) {
    const args = {};
    argv.forEach(arg => {
        const match = arg.match(/^--([^=]+)=(.*)$/);
        if (match) {
            args[match[1]] = match[2];
        } else if (arg === '--include_path') {
            args.include_path = true;
        } else if (arg === '--watch') {
            args.watch = true;
        }
    });
    return args;
}

const args = parseArgs(process.argv.slice(2));

let config = {
    folder: args.folder,
    idFile: args.idFile,
    resOutput:args.resOutput,
    resources:[]
}
const configPath = process.cwd()
config = readResourceConfig(configPath)
//--folder=C:\Users\syxme\IdeaProjects\INETLightCity\src\jsMain\resources\res --out=C:\Users\syxme\IdeaProjects\CasperUIResourceMakerJS\out.dat --idfile=C:\Users\syxme\IdeaProjects\CasperUIResourceMakerJS\R.ts


const watch = args.watch || false;
const includePath = args.include_path || false;
let debounceTimer;
if (watch){
    for (let i = 0; i < config.configs.length; i++) {
        watchDirectory(config.configs[i].resource_folder,function () {

            clearTimeout(debounceTimer);

            // Устанавливаем новый таймер на 1 секунду
            debounceTimer = setTimeout(() => {
                try {
                    remakeResources();
                } catch (e) {
                    console.error(e.message);
                }
            }, 300);
        })
    }

}
try {
    remakeResources()
}catch (e) {
    console.log(e.message)
}
function remakeResources(){
    let r = new ResourceMaker(config.configs,configPath)
    r.isWithFileNames = includePath

    r.scanAllResource()
    let binary = r.makeBinaryFile()

    console.log("rootResourceFile",config.rootResourceFile)
    if (config.rootResourceFile){
        fs.writeFileSync(config.rootResourceFile,binary)
    }
    r.makeIDFiles()
    r.saveCSS(config.style_file)
}