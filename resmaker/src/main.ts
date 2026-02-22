#!/usr/bin/env node

import fs from "fs";
import {configArray} from "@rMaker/utils/Config";
import {MainCompiler} from "@rMaker/MainCompiler";
import {watchDirectory} from "@rMaker/utils/FileWatcher";

console.log("=== CasperUI MainCompiler ===");
console.log("This tool scans and packs resources into a binary file.");
console.log("");
console.log("Usage:");
console.log("  resmaker --watch --include_path");
console.log("  (or define everything in a config file in your project folder)");
console.log("");

function parseArgs(argv: string[]): any {
    const args = {} as any;
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


let configPath = process.cwd()
// configPath = `C:\\Users\\syxme\\WebstormProjects\\INCONETServicePanel`
let config = configArray(configPath)
//--folder=C:\Users\syxme\IdeaProjects\INETLightCity\src\jsMain\resources\res --out=C:\Users\syxme\IdeaProjects\CasperUIResourceMakerJS\out.dat --idfile=C:\Users\syxme\IdeaProjects\CasperUIResourceMakerJS\R.ts

const watch = args.watch || false;
const includePath = args.include_path || false;
let debounceTimer: any = 0;
if (watch) {
    for (let i = 0; i < config.configs!.length; i++) {
        watchDirectory(config!.configs[i].resourceDir!, function () {

            clearTimeout(debounceTimer);

            debounceTimer = setTimeout(() => {
                try {
                    remakeResources();
                } catch (e) {
                    console.error(e);
                }
            }, 1000);
        })
    }
}
try {
    remakeResources()
}catch (e) {
    console.log(e)
}
function remakeResources() {
    let r = new MainCompiler(config?.configs!, configPath)
    r.isWithFileNames =  includePath

    r.scanAllResource()
    let binary = r.makeBinaryFile()

    console.log("rootResourceFile", config?.rootResourceFile)
    if (config?.rootResourceFile) {
        fs.writeFileSync(config?.rootResourceFile, binary)
    }
    r.makeIDFiles()
    if (config?.style_file) {
        r.saveCSS(config?.style_file)
    }
}
