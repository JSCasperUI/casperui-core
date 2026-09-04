#!/usr/bin/env node

import fs from "fs"
import path from "path"

const R  = "\x1b[0m"
const G  = "\x1b[32m"
const C  = "\x1b[36m"
const Y  = "\x1b[33m"
const B  = "\x1b[1m"

const log     = (s: string) => console.log(s)
const success = (s: string) => console.log(`${G}${s}${R}`)
const info    = (s: string) => console.log(`${C}  ${s}${R}`)
const warn    = (s: string) => console.log(`${Y}${s}${R}`)

const USAGE = `Usage:
  casperui-new <project-name>
  casperui-new fragment <Name>
  casperui-new widget <Name>`

const command = process.argv[2]
const argName = process.argv[3]

if (!command) {
    warn(USAGE)
    process.exit(1)
}

if (command === "fragment" || command === "widget") {
    if (!argName) {
        warn(USAGE)
        process.exit(1)
    }
    if (command === "fragment") createFragment(argName)
    else createWidget(argName)
} else {
    if (process.argv[3]) {
        warn(USAGE)
        process.exit(1)
    }
    createProject(command)
}

function createProject(projectName: string) {
    const targetDir = path.resolve(process.cwd(), projectName)

    if (fs.existsSync(targetDir)) {
        warn(`Directory "${projectName}" already exists.`)
        process.exit(1)
    }

    log(`\n${B}CasperUI — scaffolding "${projectName}"${R}\n`)

    const write = writer(targetDir)

    write("package.json",      tplPackageJson(projectName))
    write("tsconfig.json",     tplTsConfig())
    write("webpack.config.js", tplWebpack())
    write("resconfig.json",    tplResconfig())
    write("app.html",          tplAppHtml(projectName))
    write(".gitignore",        tplGitignore())

    write("src/main.ts",                           tplMainTs())
    write("src/MainActivity.ts",                   tplMainActivity())
    write("src/view/fragments/MainFragment.ts",    tplMainFragment())
    write("src/widgets/index.ts",                  tplWidgetsIndex())

    write("res/layout/root.html",   tplLayoutRoot())
    write("res/layout/main.html",   tplLayoutMain())
    write("res/style/main.css",     tplMainCss())
    write("res/string/strings.tsv", tplStrings())

    emptyDir(targetDir, "res/icons")
    emptyDir(targetDir, "res/fonts")
    emptyDir(targetDir, "assets")
    emptyDir(targetDir, "src/models")

    log("")
    success(`✓ Project created: ./${projectName}`)
    log("")
    log("Next steps:")
    log(`  cd ${projectName}`)
    log("  npm install")
    log("  npm run resources_dev   ← watch res/ → R.ts, bind.ts, res.html")
    log("  npm run start           ← dev server, reloads when resources change")
    log("")
    log("Later:")
    log("  casperui-new fragment Profile")
    log("  casperui-new widget Badge\n")
}

function createFragment(rawName: string) {
    const root = findProjectRoot()
    const parsed = parseTypeName(rawName, "Fragment")
    const layoutRel = ["fragments", ...parsed.dirSnakes, parsed.baseSnake].join("/")
    const htmlPath = `res/layout/${layoutRel}.html`
    const tsPath = `src/view/fragments/${[...parsed.dirSnakes, parsed.className].join("/")}.ts`
    const rPath = ["R.layout.fragments", ...parsed.dirSnakes, parsed.baseSnake].join(".")

    log(`\n${B}CasperUI — fragment ${parsed.className}${R}\n`)

    writeNew(root, htmlPath, tplFragmentHtml(parsed.baseSnake))
    writeNew(root, tsPath, tplFragmentTs(parsed.className, rPath))

    log("")
    success(`✓ ${parsed.className}`)
    log(`  layout  ${htmlPath}`)
    log(`  screen  ${tsPath}`)
    log(`  inflate ${rPath}(ctx)`)
    log(`  use     new ${parsed.className}(this)\n`)
}

function createWidget(rawName: string) {
    const root = findProjectRoot()
    const parsed = parseTypeName(rawName, "")
    const layoutRel = ["widgets", ...parsed.dirSnakes, parsed.baseSnake].join("/")
    const htmlPath = `res/layout/${layoutRel}.html`
    const tsPath = `src/widgets/${[...parsed.dirSnakes, parsed.className].join("/")}.ts`
    const importPath = "./" + [...parsed.dirSnakes, parsed.className].join("/")
    const rPath = ["R.layout.widgets", ...parsed.dirSnakes, parsed.baseSnake].join(".")

    log(`\n${B}CasperUI — widget ${parsed.className}${R}\n`)

    writeNew(root, htmlPath, tplWidgetHtml(parsed.baseSnake))
    writeNew(root, tsPath, tplWidgetTs(parsed.className, rPath))
    upsertWidgetRegistry(root, parsed.className, importPath)
    ensureRegisterWidgetsCall(root)

    log("")
    success(`✓ <${parsed.className} />`)
    log(`  layout ${htmlPath}`)
    log(`  class  ${tsPath}`)
    log(`  tag    ${parsed.className}`)
    log(`  after resmaker: <${parsed.className} id="..." />\n`)
}

function findProjectRoot(): string {
    let dir = process.cwd()
    for (let i = 0; i < 8; i++) {
        if (fs.existsSync(path.join(dir, "resconfig.json"))) return dir
        const parent = path.dirname(dir)
        if (parent === dir) break
        dir = parent
    }
    warn("Run this inside a CasperUI app (resconfig.json not found).")
    process.exit(1)
}

function writer(root: string) {
    return function write(filePath: string, content: string) {
        const full = path.join(root, filePath)
        fs.mkdirSync(path.dirname(full), { recursive: true })
        fs.writeFileSync(full, content, "utf8")
        info(`created  ${filePath}`)
    }
}

function writeNew(root: string, filePath: string, content: string) {
    const full = path.join(root, filePath)
    if (fs.existsSync(full)) {
        warn(`exists   ${filePath}`)
        return
    }
    fs.mkdirSync(path.dirname(full), { recursive: true })
    fs.writeFileSync(full, content, "utf8")
    info(`created  ${filePath}`)
}

function emptyDir(root: string, dirPath: string) {
    fs.mkdirSync(path.join(root, dirPath), { recursive: true })
    info(`created  ${dirPath}/`)
}

function toPascal(s: string): string {
    return s
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join("")
}

function toSnake(s: string): string {
    return s
        .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
        .replace(/[-_\s]+/g, "_")
        .toLowerCase()
}

function parseTypeName(input: string, suffix: string): {
    className: string
    baseSnake: string
    dirSnakes: string[]
} {
    const parts = input.replace(/\\/g, "/").split("/").filter(Boolean)
    if (parts.length === 0) {
        warn(`Invalid name "${input}"`)
        process.exit(1)
    }
    const dirSnakes = parts.slice(0, -1).map(toSnake)
    let last = toPascal(parts[parts.length - 1])
    if (!last || !/^[A-Za-z][A-Za-z0-9]*$/.test(last)) {
        warn(`Invalid name "${input}". Use letters, numbers, /, - or _.`)
        process.exit(1)
    }
    if (suffix && last.endsWith(suffix)) last = last.slice(0, -suffix.length)
    if (!last) {
        warn(`Invalid name "${input}"`)
        process.exit(1)
    }
    const className = suffix ? last + suffix : last
    return { className, baseSnake: toSnake(last), dirSnakes }
}

function upsertWidgetRegistry(root: string, className: string, importPath: string) {
    const rel = "src/widgets/index.ts"
    const file = path.join(root, rel)
    let src = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : ""

    if (!src.includes("@casperui/core/view/inflater/WidgetRegistrar")) {
        src = `import {WidgetRegistrar} from "@casperui/core/view/inflater/WidgetRegistrar"\n` + src
    }
    if (!src.includes(`from "${importPath}"`)) {
        src = `import {${className}} from "${importPath}"\n` + src
    }
    if (!/export function registerWidgets\s*\(/.test(src)) {
        src = src.replace(/\s*$/, "") + `\n\nexport function registerWidgets() {\n}\n`
    }
    if (!src.includes(`register("${className}"`) && !src.includes(`register('${className}'`)) {
        src = src.replace(
            /export function registerWidgets\s*\(\s*\)\s*\{/,
            `export function registerWidgets() {\n    WidgetRegistrar.register("${className}", (ctx, tag, attr) => new ${className}(ctx, tag, attr))`
        )
    }

    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, src, "utf8")
    info(`updated  ${rel}`)
}

function ensureRegisterWidgetsCall(root: string) {
    const rel = "src/main.ts"
    const file = path.join(root, rel)
    if (!fs.existsSync(file)) {
        warn(`missing  ${rel} — call registerWidgets() at startup`)
        return
    }
    let src = fs.readFileSync(file, "utf8")
    if (src.includes("registerWidgets")) return

    if (!src.includes('from "@app/widgets"')) {
        src = `import {registerWidgets} from "@app/widgets"\n` + src
    }
    src = src.replace(
        /(import[^\n]+\n)+/,
        (block) => block + "\nregisterWidgets()\n"
    )
    fs.writeFileSync(file, src, "utf8")
    info(`updated  ${rel}`)
}

// ─── templates ────────────────────────────────────────────────────────────────

function tplPackageJson(name: string): string {
    return JSON.stringify({
        name,
        version: "0.1.0",
        private: true,
        scripts: {
            start:             "webpack serve --mode development",
            build:             "webpack --mode production",
            resources_dev:     "resmaker --watch",
            resources_release: "resmaker",
        },
        dependencies: {
            "@casperui/core": "^0.0.23",
        },
        devDependencies: {
            typescript:           "^5.6.2",
            "webpack":            "^5",
            "webpack-cli":        "^5",
            "webpack-dev-server": "^5",
            "ts-loader":          "^9",
            "html-webpack-plugin":"^5",
        },
    }, null, 2)
}

function tplTsConfig(): string {
    return JSON.stringify({
        compilerOptions: {
            target:                 "ESNext",
            module:                 "ESNext",
            moduleResolution:       "bundler",
            experimentalDecorators: true,
            lib:                    ["ESNext", "DOM"],
            paths:                  { "@app/*": ["src/*"] },
        },
        include: ["src/**/*.ts"],
    }, null, 2)
}

function tplWebpack(): string {
    return `const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

module.exports = (env, argv) => ({
    entry: './src/main.ts',
    output: {
        path: path.resolve(__dirname, 'assets'),
        filename: 'app.js',
        clean: false,
    },
    resolve: {
        extensions: ['.ts', '.js'],
        alias: {
            '@app': path.resolve(__dirname, 'src'),
        },
    },
    module: {
        rules: [{
            test: /\\.ts$/,
            use: 'ts-loader',
            exclude: /node_modules/,
        }],
    },
    devServer: {
        static: {
            directory: path.resolve(__dirname, 'assets'),
            watch: true,
        },
        port: 9000,
        hot: false,
        liveReload: true,
        watchFiles: ['assets/res.html', 'assets/app.css', 'src/R.ts', 'src/bind.ts'],
        headers: {
            'Cache-Control': 'no-store',
        },
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'app.html',
            filename: 'index.html',
            inject: true,
        }),
    ],
})
`
}

function tplResconfig(): string {
    return JSON.stringify({
        resourceDir: "./res",
        output: {
            R:    "src/R.ts",
            bind: "src/bind.ts",
            res:  "assets/res.html",
            css:  "assets/app.css",
        },
        subResources: [],
    }, null, 2)
}

function tplAppHtml(name: string): string {
    return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <link rel="stylesheet" href="app.css"/>
    <title>${name}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; overflow: hidden; }
    </style>
</head>
<body></body>
</html>
`
}

function tplGitignore(): string {
    return `node_modules/
dist/
assets/app.js
assets/app.css
assets/res.html
assets/index.html
src/R.ts
src/bind.ts
`
}

function tplMainTs(): string {
    return `import {Application} from "@casperui/core/app/Application"
import {registerWidgets} from "@app/widgets"
import {MainActivity} from "@app/MainActivity"

registerWidgets()

const app = new Application()
window.onload = () => app.startActivity(new MainActivity())
`
}

function tplMainActivity(): string {
    return `import {Activity} from "@casperui/core/app/Activity"
import {R} from "@app/R"
import {MainFragment} from "@app/view/fragments/MainFragment"

export class MainActivity extends Activity {
    async onCreate() {
        this.setContentView(R.layout.root(this).root)
        this.replaceFragment(R.id.app_content, new MainFragment(this))
    }
}
`
}

function tplMainFragment(): string {
    return `import {Screen} from "@casperui/core/app/Screen"
import {R} from "@app/R"

export class MainFragment extends Screen(R.layout.main) {
    onCreated() {
        this.bind.title.setText("Hello, CasperUI!")
    }
}
`
}

function tplWidgetsIndex(): string {
    return `import {WidgetRegistrar} from "@casperui/core/view/inflater/WidgetRegistrar"

export function registerWidgets() {
}
`
}

function tplFragmentTs(className: string, rPath: string): string {
    return `import {Screen} from "@casperui/core/app/Screen"
import {R} from "@app/R"

export class ${className} extends Screen(${rPath}) {
    onCreated() {
    }
}
`
}

function tplFragmentHtml(className: string): string {
    return `<div id="root" class="${className}">
</div>
`
}

function tplWidgetTs(className: string, rPath: string): string {
    return `import {View, ViewTag} from "@casperui/core/view/View"
import {Context} from "@casperui/core/content/Context"
import {ViewAttributes} from "@casperui/core/view/ViewAttributes"
import {R} from "@app/R"

export class ${className} extends View {
    constructor(context: Context, tag?: ViewTag, attr?: ViewAttributes) {
        super(context, "div", attr)
        const bind = ${rPath}(context)
        this.replaceNode(bind.root)
    }
}
`
}

function tplWidgetHtml(className: string): string {
    return `<div id="root" class="${className}">
</div>
`
}

function tplLayoutRoot(): string {
    return `<div id="root" style="height:100%;width:100%">
    <div id="app_content" style="height:100%"></div>
</div>
`
}

function tplLayoutMain(): string {
    return `<div class="main-page" id="root">
    <h1 id="title" class="main-title"></h1>
</div>
`
}

function tplMainCss(): string {
    return `:root {
    --bg:      #1a1a2e;
    --surface: #16213e;
    --accent:  #e94560;
    --text:    #e0e0e0;
}

body {
    background: var(--bg);
    color: var(--text);
    font-family: sans-serif;
}

.main-page {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
}

.main-title {
    font-size: 2.5rem;
    letter-spacing: -0.5px;
}
`
}

function tplStrings(): string {
    return `key\tru\ten
app_name\tМоё приложение\tMy Application
`
}
