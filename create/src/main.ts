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

const projectName = process.argv[2]
if (!projectName) {
    warn("Usage: casperui-new <project-name>")
    process.exit(1)
}

const targetDir = path.resolve(process.cwd(), projectName)

if (fs.existsSync(targetDir)) {
    warn(`Directory "${projectName}" already exists.`)
    process.exit(1)
}

log(`\n${B}CasperUI — scaffolding "${projectName}"${R}\n`)

function write(filePath: string, content: string) {
    const full = path.join(targetDir, filePath)
    fs.mkdirSync(path.dirname(full), { recursive: true })
    fs.writeFileSync(full, content, "utf8")
    info(`created  ${filePath}`)
}

function emptyDir(dirPath: string) {
    fs.mkdirSync(path.join(targetDir, dirPath), { recursive: true })
    info(`created  ${dirPath}/`)
}

// ─── files ───────────────────────────────────────────────────────────────────

write("package.json",      tplPackageJson(projectName))
write("tsconfig.json",     tplTsConfig())
write("webpack.config.js", tplWebpack())
write("resconfig.json",    tplResconfig())
write("app.html",          tplAppHtml(projectName))
write(".gitignore",        tplGitignore())

write("src/main.ts",                           tplMainTs())
write("src/MainActivity.ts",                   tplMainActivity())
write("src/view/fragments/MainFragment.ts",    tplMainFragment())

write("res/layout/root.html",   tplLayoutRoot())
write("res/layout/main.html",   tplLayoutMain())
write("res/style/main.css",     tplMainCss())
write("res/string/strings.tsv", tplStrings())

emptyDir("res/icons")
emptyDir("res/fonts")
emptyDir("assets")
emptyDir("src/models")

// ─── done ─────────────────────────────────────────────────────────────────────

log("")
success(`✓ Project created: ./${projectName}`)
log("")
log("Next steps:")
log(`  cd ${projectName}`)
log("  npm install")
log("  npm run resources_dev   ← generates src/R.ts and src/bind.ts")
log("  npm run start\n")

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
            "@casperui/core": "^0.0.19",
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
        static: './assets',
        port: 9000,
        hot: true,
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
import {MainActivity} from "@app/MainActivity"

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
        this.replaceFragment(R.id.app_content, new MainFragment())
    }
}
`
}

function tplMainFragment(): string {
    return `import {JFragment} from "@casperui/core/app/JFragment"
import {View} from "@casperui/core/view/View"
import {R} from "@app/R"

export class MainFragment extends JFragment {
    private bind = R.layout.main(this.ctx())

    onCreateView(): View {
        return this.bind.root
    }

    onCreated() {
        this.bind.title.setText("Hello, CasperUI!")
    }
}
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
