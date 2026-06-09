# CasperUI Core — Полное руководство (RU)

> Версия `@casperui/core` 0.0.19  
> Фреймворк для построения браузерных приложений с архитектурой, вдохновлённой Android SDK.

---

## Содержание

1. [Концепция и архитектура](#1-концепция-и-архитектура)
2. [Структура проекта](#2-структура-проекта)
3. [Ресурсы и R.ts](#3-ресурсы-и-rts)
4. [Application — точка входа](#4-application--точка-входа)
5. [Activity — главный экран](#5-activity--главный-экран)
6. [View — базовый UI-компонент](#6-view--базовый-ui-компонент)
7. [Лейауты и биндинги (BXML)](#7-лейауты-и-биндинги-bxml)
    - [@{locale_key} — строки локализации в HTML](#locale_key--строки-локализации-в-html)
    - [{{id}} — именованные текстовые узлы](#id--именованные-текстовые-узлы)
    - [\<template\> — фабричные функции](#template--фабричные-функции)
    - [\<style\> внутри лейаута](#style-внутри-лейаута)
8. [Fragments — составные экраны](#8-fragments--составные-экраны)
9. [LiveData и ViewModel — реактивное состояние](#9-livedata-и-viewmodel--реактивное-состояние)
10. [Пользовательские виджеты](#10-пользовательские-виджеты)
11. [Навигация и FragmentManager](#11-навигация-и-fragmentmanager)
12. [Context и Resources](#12-context-и-resources)
13. [Canvas и графика](#13-canvas-и-графика)
14. [Паттерны и best practices](#14-паттерны-и-best-practices)

---

## 1. Концепция и архитектура

CasperUI — фреймворк, переносящий архитектурные паттерны Android на веб.

### Ключевые параллели с Android

| Android            | CasperUI              |
|--------------------|-----------------------|
| `Application`      | `Application`         |
| `Activity`         | `Activity`            |
| `Fragment`         | `JFragment`           |
| `View`             | `View`                |
| `ViewModel`        | `ViewModel`           |
| `LiveData`         | `LiveData`            |
| `FragmentManager`  | `FragmentManager`     |
| `R.id`, `R.layout` | `R.id`, `R.layout`    |
| XML-лейауты        | HTML-лейауты → BXML   |

### Жизненный цикл приложения

```
main.ts
  └── new Application()          ← загружает res.html (иконки, шрифты, строки)
  └── application.startActivity(new MainActivity())
        └── activity.onCreate()
              └── setContentView(layout)
                    └── replaceFragment(id, fragment)
                          └── fragment.onCreateView()
                          └── fragment.onCreated()
```

---

## 2. Структура проекта

```
my-app/
├── src/
│   ├── main.ts              ← точка входа
│   ├── MainActivity.ts      ← главный Activity
│   ├── R.ts                 ← ГЕНЕРИРУЕТСЯ (не редактировать)
│   ├── bind.ts              ← ГЕНЕРИРУЕТСЯ (не редактировать)
│   ├── models/              ← ViewModel-классы
│   ├── view/fragments/      ← JFragment-классы
│   └── widgets/             ← кастомные View-компоненты
├── res/
│   ├── layout/              ← HTML-лейауты
│   ├── icons/               ← SVG-иконки
│   ├── fonts/               ← шрифты (.ttf, .woff)
│   ├── string/              ← строки локализации (.tsv)
│   └── style/               ← CSS-файлы
├── assets/                  ← ГЕНЕРИРУЕТСЯ: app.js, res.html, app.css
├── resconfig.json
├── tsconfig.json
└── webpack.config.js
```

### resconfig.json

```json
{
  "resourceDir": "./res",
  "output": {
    "R": "src/R.ts",
    "bind": "src/bind.ts",
    "res": "assets/res.html",
    "css": "assets/app.css"
  },
  "subResources": []
}
```

### Команды

```bash
npm run resources_dev      # собрать ресурсы (dev)
npm run resources_release  # собрать ресурсы (prod)
npm run start              # dev-сервер
npm run build              # сборка
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "experimentalDecorators": true,
    "lib": ["ESNext", "DOM"],
    "paths": { "@app/*": ["src/*"] }
  }
}
```

---

## 3. Ресурсы и R.ts

`resmaker` компилирует всё содержимое `res/` в бинарный пакет `res.html` и генерирует типизированный файл `R.ts`.

### Структура res/

```
res/
├── layout/
│   ├── root.html              → R.layout.root(ctx)
│   └── auth/
│       └── auth.html          → R.layout.auth.auth(ctx)
├── icons/
│   ├── check.svg              → R.icons.check
│   └── arrow_down.svg         → R.icons.arrow_down
├── fonts/
│   └── regular.ttf            → R.fonts.regular
├── string/
│   └── strings.tsv            → R.lang.hello
└── style/
    └── main.css               ← включается в assets/app.css
```

- Папки в `res/layout/` становятся вложенными объектами: `res/layout/widgets/checkbox/main.html` → `R.layout.widgets.checkbox.main(ctx)`
- Атрибут `id` в HTML становится полем биндинга и записью в `R.id`

### Использование R.ts

```typescript
import {R} from "@app/R"

const bind = R.layout.auth.auth(this.ctx())  // создаёт DOM, возвращает биндинг
bind.root                                     // корневой View

myView.setSVGById(R.icons.check)             // вставить SVG

ctx.getString(R.lang.hello)                  // строка локализации

activity.byId(R.id.email)                    // найти View по id
```

---

## 4. Application — точка входа

### src/main.ts

```typescript
import {Application} from "@casperui/core/app/Application"
import {WidgetRegistrar} from "@casperui/core/view/inflater/WidgetRegistrar"
import {CheckBoxBlock} from "@app/widgets/CheckBoxBlock"
import {MainActivity} from "@app/MainActivity"

WidgetRegistrar.register("CheckBoxBlock", (ctx, tag, attr) => new CheckBoxBlock(ctx, tag, attr))
WidgetRegistrar.register("RadioGroup",    (ctx, tag, attr) => new RadioGroup(ctx, tag, attr))

const application = new Application()

window.onload = () => {
    application.startActivity(new MainActivity())
}
```

`Application` скачивает `res.html` и инициализирует ресурсы; `startActivity` дожидается загрузки перед вызовом `onCreate`.

### Загрузка шрифтов

```typescript
// В MainActivity.onCreate():
const appCtx = this.getApplicationContext()
const res = appCtx.getResources()
appCtx.addFontFace("ui", res.getData(R.fonts.regular))
appCtx.addFontFace("ui", res.getData(R.fonts.bold), { weight: "700" })
```

---

## 5. Activity — главный экран

`Activity` — единственный для приложения, реализует `ILiveManager`.

```typescript
import {Activity} from "@casperui/core/app/Activity"
import {R} from "@app/R"
import {UsersModel} from "@app/models/UsersModel"

export class MainActivity extends Activity {

    usersModel     = new UsersModel()
    analyticsModel = new AnalyticsModel()

    async onCreate() {
        const bind = R.layout.root(this)
        this.setContentView(bind.root)

        await this.usersModel.ping()

        if (this.usersModel.self.getValue()) {
            this.showMainContent()
        } else {
            this.showAuthFragment()
        }
    }

    showAuthFragment() {
        this.replaceFragment(R.id.app_content, new AuthFragment())
    }

    showMainContent() {
        this.replaceFragment(R.id.app_content, new MainFragment())
    }
}
```

### Методы Activity

| Метод | Описание |
|---|---|
| `onCreate()` | Инициализация UI. |
| `setContentView(view)` | Установить корневой View (заменяет `document.body`). |
| `replaceFragment(id, fragment)` | Поместить фрагмент в контейнер с `R.id`. |
| `byId(R.id.foo)` | Найти View по ID во всём дереве. |
| `byPath([0, 1])` | Найти View по пути индексов. |
| `getWindowView()` | View, обёртывающий `document.body`. |
| `getApplicationContext()` | Возвращает `Application`. |
| `getFragmentManager()` | Менеджер фрагментов. |

---

## 6. View — базовый UI-компонент

`View` — обёртка над DOM-элементом.

### Создание

```typescript
import {View} from "@casperui/core/view/View"

const div   = new View(context)
const span  = new View(context, "span")
const input = new View(context, "input")

// Обернуть существующий DOM-элемент
const wrap  = new View(context, document.getElementById("my-el"))

// С атрибутами
const btn   = new View(context, "button", { class: "btn btn-primary" })
```

### Текст и значения

```typescript
view.setText("Привет")        // textContent
view.setValue("text")         // .value (для <input>)
view.getValue()
view.setChecked(true)
view.isChecked()
view.setDefaultValue("def")
view.resetValue()
```

### Видимость

```typescript
view.show()
view.hide()
view.toggle()
view.toggle(true)
view.setVisibility(false)
view.getVisibility()          // boolean
view.setOpacity(0.5)
```

### CSS-классы

```typescript
view.addClass("active")
view.removeClass("active")
view.hasClass("active")       // boolean
view.swapClass("inactive", "active")
view.addClassList("a b c")    // несколько сразу

view.activate()               // добавляет "active"
view.deactivate()             // убирает "active"
view.isActive()
```

### Размеры и позиция

```typescript
view.getWidth()               // clientWidth
view.getHeight()              // clientHeight
view.setWidth(200)
view.setHeight(100)
view.setLeft(50)
view.getLeft()
view.setTop(20)
view.getTop()                 // кэшированное
view.getTopReal()             // из style
view.setTranslateY(30)
view.getTranslateY()
view.getViewportRect()        // Rect с экранными координатами
```

### Прокрутка

```typescript
view.getScrollY()
view.setScrollY(100)
view.getScrollX()
view.setScrollX(0)
```

### Стили и атрибуты

```typescript
view.getStyle()                           // CSSStyleDeclaration
view.setStyle("background-color", "red")
view.setParameter("data-id", "42")
view.getParameter("data-id")
view.appendAttributes({ "data-x": "1", class: "foo" })
```

### Иконки

```typescript
view.setSVGById(R.icons.arrow_down)       // SVG из ресурсов
view.setImageSrc("/img.png")              // src для <img>
```

### События

```typescript
view.setOnClickListener((e) => { ... })
view.setOnFastClickListener((e) => { ... })  // mousedown
view.onMouseDownListener((e) => { ... })
view.onMouseOverListener((e) => { ... })
view.onMouseOutListener((e) => { ... })
view.onMouseMoveListener((e) => { ... })
view.onMouseDoubleClickListener((e) => { ... })

view.vEvent("scroll", (e) => { ... })
view.vEvent("input", handler, 300)        // с дебаунсом (ms)

view.mNode.addEventListener("keydown", handler, { passive: true })  // DOM напрямую
```

> Все методы `setOn*/vEvent` внутри используют `makeSafeEvent` — повторный вызов **заменяет** предыдущий обработчик того же типа, не добавляет новый.

### Дочерние View

```typescript
view.addView(child)
view.addView(child, 0)       // по индексу
view.removeView(child)
view.removeAllViews()
view.hasView(child)
view.indexView(child)
view.getChildren()           // View[]
view.x([a, b, c])           // добавить несколько цепочкой
```

### Поиск в дереве

```typescript
view.byId(R.id.email)
view.byIds([R.id.title, R.id.body])
view.byPath([0, 2, 1])
```

### Прочее

```typescript
view.setRef(obj)
view.getRef<MyType>()

view.waitingSelf(() => {         // выполнит callback когда View попадёт в document.body
    console.log(view.getWidth())
})

view.handleViewError()           // добавляет класс "snake-anim" (анимация ошибки)
```

---

## 7. Лейауты и биндинги (BXML)

Лейауты — HTML-файлы в `res/layout/`. `resmaker` компилирует их в бинарный формат и генерирует TypeScript-биндинги. Никакого рантаймового парсинга нет — inflate это вызов сгенерированной функции.

### Создание лейаута

```html
<!-- res/layout/fragments/profile.html -->
<div class="profile-card" id="root">
    <img id="avatar" class="avatar" />
    <span id="name" class="profile-name"></span>
    <span id="email" class="profile-email"></span>
    <button id="logout_btn" class="btn">@{logout}</button>
</div>
```

После `npm run resources_dev` генерируется биндинг с интерфейсом:

```typescript
// R.layout.fragments.profile(ctx) возвращает:
{
    root:       View
    avatar:     View
    name:       View
    email:      View
    logout_btn: View
}
```

### Использование биндинга

```typescript
const bind = R.layout.fragments.profile(this.ctx())

bind.name.setText("Иван Петров")
bind.email.setText("ivan@example.com")
bind.avatar.setImageSrc("/avatars/ivan.png")
bind.logout_btn.setOnClickListener(() => this.onLogout())

this.setContentView(bind.root)
// или
container.addView(bind.root)
```

### Кастомные виджеты в HTML

Зарегистрированный виджет используется как тег:

```html
<CheckBoxBlock id="enable_notifications" title="Уведомления" />
<RadioGroup id="theme_selector" />
<DateRangePicker id="date_range" />
```

При inflate `WidgetRegistrar.createInstance` находит конструктор по тегу и передаёт атрибуты из бинарных данных.

---

### @{locale_key} — строки локализации в HTML

```html
<label>@{rule_name}</label>
<input placeholder="@{enter_value}" />
<button>@{save_button}</button>
```

`resmaker` заменяет `@{key}` на текстовый узел с соответствующей строкой из `res/string/strings.tsv`.

> При смене локали во время выполнения текст не обновляется — нужен re-inflate.

---

### {{id}} — именованные текстовые узлы

`{{id}}` создаёт именованный текстовый узел. Находится через `byId(R.id.id)` и обновляется через `setText()`.

```html
<div class="split_block_text">Имя: {{name}}</div>
<span class="status-line">Статус: {{status_text}} (код {{status_code}})</span>
```

```typescript
const bind = R.layout.widgets.split_item(ctx)
bind.name.setText("Иван")
bind.status_text.setText("Активен")
bind.status_code.setText("200")
```

Разница от `id` на теге:
- `id="foo"` на теге → `bind.foo` — полноценный `View` (элемент)
- `{{foo}}` — текстовый узел; полезен когда нужно менять часть текста среди статического

---

### \<template\> — фабричные функции

`<template id="name">` компилируется в функцию-фабрику. Каждый вызов создаёт новый независимый экземпляр DOM.

```html
<div id="root">
    <div id="list_container"></div>

    <template id="list_item">
        <div class="list-item">
            <i id="icon" class="item-icon"></i>
            <span>{{title}}</span>
            <span class="item-sub">{{subtitle}}</span>
            <button id="delete_btn" class="btn-icon"></button>
        </div>
    </template>
</div>
```

```typescript
export interface IMyList {
    root:           View
    list_container: View
    list_item: () => {        // ← функция, а не View
        root:       View
        title:      View
        subtitle:   View
        delete_btn: View
    }
}
```

```typescript
const layout = R.layout.my_list(this.ctx())

function addItem(title: string, sub: string) {
    const item = layout.list_item()   // новый экземпляр каждый раз
    item.title.setText(title)
    item.subtitle.setText(sub)
    item.delete_btn.setOnClickListener(() => {
        layout.list_container.removeView(item.root)
    })
    layout.list_container.addView(item.root)
}
```

**Переключатель шаблонов:**

```html
<div id="root">
    <RadioGroup id="selector_type"></RadioGroup>
    <div id="selector_content"></div>

    <template id="rule_weekday" class="rule_child">
        <SelectGroup id="days" class="vs_flex_50">
            <div>@{abb_monday}</div>
            <div>@{abb_tuesday}</div>
            <!-- ... -->
        </SelectGroup>
    </template>

    <template id="rule_dates" class="rule_child">
        <textarea id="dates_area" rows="3"></textarea>
    </template>
</div>
```

```typescript
export class RuleEditor extends JFragment {
    private layout = R.layout.profiles.rules.rule_editor(this.ctx())
    private currentRule: View | null = null

    onCreateView() { return this.layout.root }

    onCreated() {
        const selector = this.layout.selector_type as RadioGroup
        selector.setOnItemSelected((index) => this.showTemplate(index))
        selector.setActive(0, true)
    }

    private showTemplate(index: number) {
        const container = this.layout.selector_content
        if (this.currentRule) container.removeView(this.currentRule)

        const factories = [
            () => this.layout.rule_weekday(),
            () => this.layout.rule_dates(),
        ]
        const bind = factories[index]()
        this.currentRule = bind.root
        container.addView(bind.root)
    }
}
```

---

### \<style\> внутри лейаута

`<style>` в HTML-лейауте вставляется в DOM вместе с разметкой при inflate.

```html
<div id="root" class="date-picker">
    <style>
        .date-picker { display: flex; gap: 8px; align-items: center; }
        .date-picker-input { background: #1e1e1e; border-radius: 6px; padding: 6px 10px; }
    </style>
    <input id="start" class="date-picker-input" />
    <span>—</span>
    <input id="end" class="date-picker-input" />
</div>
```

> Стили глобальные — используйте уникальные имена классов (BEM или префикс компонента).

Работает и внутри `<template>`:

```html
<template id="alert_card">
    <style>
        .alert-card { border-left: 3px solid var(--accent); padding: 10px; }
    </style>
    <div class="alert-card" id="root">
        <span id="icon"></span>
        <span>{{message}}</span>
    </div>
</template>
```

---

### Как работает inflate (под капотом)

Каждая функция биндинга использует `_getLayCTX`, который предоставляет четыре фабрики:

```typescript
let [c, t, l, i] = _getLayCTX(ctx, layoutId)
//   │  │  │  └─ i()            → пустой текстовый узел ({{id}})
//   │  │  └──── l(langId)      → текстовый узел из локали (@{key})
//   │  └─────── t(valueId)     → текстовый узел из бинарных данных (<style>, статика)
//   └────────── c(tag, attrId) → View или виджет с атрибутами из бинарных данных
```

`c` ищет тег в `WidgetRegistrar` — именно так кастомные виджеты создаются при inflate.

---

## 8. Fragments — составные экраны

### Создание Fragment

```typescript
import {JFragment} from "@casperui/core/app/JFragment"
import {View} from "@casperui/core/view/View"
import {R} from "@app/R"
import {MainActivity} from "@app/MainActivity"

export class ProfileFragment extends JFragment {

    private bind = R.layout.fragments.profile(this.ctx())
    private get main() { return this.getActivity() as MainActivity }

    onCreateView(): View {
        return this.bind.root
    }

    onCreated() {
        const user = this.main.usersModel.self.getValue()
        this.bind.name.setText(user?.name ?? "")

        this.bind.logout_btn.setOnClickListener(async () => {
            await this.main.usersModel.logout()
            this.main.showAuthFragment()
        })

        this.main.usersModel.self.observe(this, (user) => {
            this.bind.name.setText(user?.name ?? "")
        })
    }

    onAttachSingle() { /* первый раз в DOM — DOM-зависимая инициализация */ }
    onAttach()       { /* каждый раз в DOM */ }
    onDetach()       { /* уход с экрана — очистить ресурсы */ }
}
```

### Жизненный цикл Fragment

```
replaceFragment(id, new MyFragment())
  └── onCreateView()      ← вернуть View (DOM ещё не вставлен)
  └── onCreated()         ← инициализировать логику
  └── [View вставляется в DOM]
  └── onAttachSingle()    ← только при первом attach
  └── onAttach()          ← при каждом attach

replaceFragment(id, другой)
  └── onDetach()          ← очистить ресурсы
```

### Когда что использовать

| Хук | Когда | Что делать |
|---|---|---|
| `onCreateView()` | До DOM | Вернуть `this.bind.root` |
| `onCreated()` | После `onCreateView` | Обработчики, подписки на LiveData |
| `onAttachSingle()` | Первый раз в DOM | Размеры, Canvas, фокус — всё что требует DOM |
| `onAttach()` | Каждый раз в DOM | Рестарт поллинга, обновление данных |
| `onDetach()` | Уход | Очистить интервалы, анимации |

> `getWidth()`, `getHeight()`, инициализация `<canvas>` вернут `0` в `onCreated()` — элемент ещё не в DOM. Используйте `onAttachSingle()`.

### Пример: DOM-зависимая инициализация

```typescript
export class ChartFragment extends JFragment {
    private bind = R.layout.fragments.chart(this.ctx())
    private chart: Chart | null = null

    onCreateView() { return this.bind.root }

    onCreated() {
        this.bind.title.setText("Загрузка...")
    }

    onAttachSingle() {
        const canvas = this.bind.chart_canvas.mNode as HTMLCanvasElement
        this.chart = new Chart(canvas, { type: "line", data: { datasets: [] } })

        const width = this.bind.container.getWidth()  // корректный размер
        this.loadData()
    }

    onAttach() {
        this.main.analyticsModel.startPolling()
    }

    onDetach() {
        this.main.analyticsModel.stopPolling()
        this.chart?.destroy()
        this.chart = null
    }
}
```

### Вспомогательные методы JFragment

```typescript
this.ctx()
this.getActivity()
this.getFragmentManager()
this.getView()
this.replaceFragment(id, fragment)
```

### Вложенные фрагменты

```html
<!-- res/layout/fragments/main.html -->
<div class="main-layout" id="root">
    <nav id="sidebar">...</nav>
    <div id="content_area"></div>
</div>
```

```typescript
export class MainFragment extends JFragment {
    private bind = R.layout.fragments.main(this.ctx())

    onCreateView() { return this.bind.root }

    onCreated() {
        this.replaceFragment(R.id.content_area, new DashboardFragment())
    }

    showSettings() {
        this.replaceFragment(R.id.content_area, new SettingsFragment())
    }
}
```

---

## 9. LiveData и ViewModel — реактивное состояние

### LiveData

```typescript
import {LiveData} from "@casperui/core/live/LiveData"

const counter = new LiveData<number>(0)

counter.setValue(42)          // установить → уведомит всех наблюдателей
counter.setIfChanged(42)      // установить только если изменилось
counter.getValue()            // 42
counter.update()              // уведомить без изменения (если мутировали объект)

const list = new LiveData<string[]>([])
list.pushValueToArray("item") // добавить в массив и уведомить
```

### Наблюдение

`Activity` и `JFragment` реализуют `ILiveManager` — их можно передавать как observer напрямую.

```typescript
model.counter.observe(this, (value, caller) => {
    this.bind.label.setText(String(value))
})
```

- Callback вызывается сразу при подписке (если `LiveManager` активен)
- `caller` — аргумент из `setValue(value, caller)`, полезен для фильтрации источника

### ViewModel

```typescript
import {ViewModel} from "@casperui/core/live/ViewModel"
import {LiveData} from "@casperui/core/live/LiveData"
import {LiveDataObjectId} from "@casperui/core/live/LiveDataObjectId"

export class UsersModel extends ViewModel {
    isLoading = new LiveData<boolean>(false)
    self      = new LiveData<IUser | null>(null)
    users     = new LiveDataObjectId<IUser[]>([])  // оптимизирован для массивов объектов с id

    async loadUsers() {
        this.isLoading.setValue(true)
        try {
            this.users.setValue(await this.api.post("search"))
        } finally {
            this.isLoading.setValue(false)
        }
    }

    async auth(email: string, password: string) {
        this.self.setValue(await this.api.post("sign-in", { email, password }))
    }

    async logout() {
        await this.api.post("sign-out")
        this.self.setValue(null)
    }
}
```

Модели создаются в `Activity` один раз и доступны из любого `Fragment`:

```typescript
// MainActivity
usersModel = new UsersModel()

// В Fragment
private get main() { return this.getActivity() as MainActivity }

onCreated() {
    this.main.usersModel.self.observe(this, (user) => {
        if (user) {
            this.bind.name.setText(user.name)
        } else {
            this.main.showAuthFragment()
        }
    })

    this.main.usersModel.isLoading.observe(this, (loading) => {
        this.bind.spinner.toggle(loading)
    })
}
```

### MappedLiveData

```typescript
import {MappedLiveData} from "@casperui/core/live/MappedLiveData"

const fullName = new MappedLiveData(
    userModel.self,
    (user) => user ? `${user.firstName} ${user.lastName}` : ""
)

fullName.observe(this, (name) => this.bind.title.setText(name))
```

---

## 10. Пользовательские виджеты

Виджет — это `View` с собственным лейаутом и логикой.

### Минимальный виджет

```typescript
import {View, ViewTag} from "@casperui/core/view/View"
import {Context} from "@casperui/core/content/Context"
import {ViewAttributes} from "@casperui/core/view/ViewAttributes"
import {R} from "@app/R"

export class Badge extends View {
    constructor(context: Context, tag?: ViewTag, attr?: ViewAttributes) {
        super(context, "span", attr)
        this.replaceNode(R.layout.widgets.badge(context).root)

        if (attr?.["text"]) {
            this.byId(R.id.badge_label).setText(attr["text"] as string)
        }
    }

    setLabel(text: string) {
        this.byId(R.id.badge_label).setText(text)
        return this
    }
}
```

### Регистрация и использование в HTML

```typescript
// main.ts
WidgetRegistrar.register("Badge", (ctx, tag, attr) => new Badge(ctx, tag, attr))
```

```html
<Badge id="status_badge" text="Новый" />
```

### Паттерн: виджет с callback

```typescript
export class CheckBoxBlock extends View {
    private mIsChecked = false
    onChange?: (checked: boolean) => void

    constructor(context: Context, tag?: ViewTag, attr?: ViewAttributes) {
        super(context, "div", attr)
        const bind = R.layout.widgets.checkbox.main(context)
        this.replaceNode(bind.root)

        if (attr?.["title"]) bind.title.setText(attr["title"] as string)

        this.setOnClickListener(() => this.setBoolValue(!this.mIsChecked))
        this.setBoolValue(false)
    }

    setBoolValue(value: boolean) {
        this.mIsChecked = value
        this.byId(R.id.icon).setSVGById(value ? R.icons.switch_on : R.icons.switch_off)
        this.onChange?.(this.mIsChecked)
        return this
    }

    setOnChange(fn: (v: boolean) => void) { this.onChange = fn; return this }
    isChecked() { return this.mIsChecked }
}
```

### Паттерн: RadioGroup (одиночный выбор)

```typescript
export class RadioGroup extends View {
    private activeIndex = 0
    private mCallback?: (index: number) => void

    setOnItemSelected(fn: (index: number) => void) { this.mCallback = fn; return this }

    setActive(index: number, emit = true) {
        this.getChildren().forEach(c => c.deactivate())
        this.getChildren()[index]?.activate()
        this.activeIndex = index
        if (emit) this.mCallback?.(index)
        return this
    }

    getActive() { return this.activeIndex }

    addView(view: View, index?: number) {
        super.addView(view, index)
        view.setOnClickListener(() => this.setActive(this.getChildren().indexOf(view)))
        return this
    }
}
```

### Паттерн: виджет с памятью (localStorage)

```typescript
export class GroupBlock extends View {
    private memoryKey?: string
    private isOpen = true

    constructor(context: Context, tag?: ViewTag, attr?: ViewAttributes) {
        super(context, "div", attr)
        const bind = R.layout.widgets.group_block.main(context)
        this.replaceNode(bind.root)

        if (attr?.["memory"]) {
            this.memoryKey = "gb_" + attr["memory"]
            const saved = localStorage.getItem(this.memoryKey)
            if (saved !== null) this.isOpen = saved === "1"
        }

        bind.header.setOnClickListener(() => {
            this.isOpen = !this.isOpen
            this.updateVisibility()
            if (this.memoryKey) localStorage.setItem(this.memoryKey, this.isOpen ? "1" : "0")
        })

        this.updateVisibility()
    }

    private updateVisibility() {
        this.byId(R.id.content).toggle(this.isOpen)
        this.byId(R.id.open_icon).setSVGById(this.isOpen ? R.icons.arrow_down : R.icons.arrow_right)
    }

    addView(view: View, index?: number) {
        this.byId(R.id.content).addView(view, index)
        return this
    }
}
```

---

## 11. Навигация и FragmentManager

```typescript
// В Activity
this.replaceFragment(R.id.app_content, new MainFragment())

// В Fragment (вложенные)
this.replaceFragment(R.id.content_area, new SettingsFragment())

// Через менеджер
this.getFragmentManager().replaceFragment(R.id.content_area, new SettingsFragment())
```

При `replaceFragment`: старый фрагмент получает `onDetach()`, его DOM удаляется; новый проходит `onCreateView` → `onCreated` → `onAttachSingle` (первый раз) → `onAttach`.

### Паттерн: side-bar навигация

```typescript
export class MainFragment extends JFragment {
    private bind = R.layout.fragments.main(this.ctx())

    onCreateView() { return this.bind.root }

    onCreated() {
        const navItems = [
            this.bind.nav_dashboard,
            this.bind.nav_stats,
            this.bind.nav_users,
        ]

        navItems.forEach((item, i) => {
            item.setOnClickListener(() => {
                navItems.forEach(n => n.deactivate())
                item.activate()
                const fragments = [new DashboardFragment(), new StatsFragment(), new UsersFragment()]
                this.replaceFragment(R.id.content_area, fragments[i])
            })
        })

        navItems[0].activate()
        this.replaceFragment(R.id.content_area, new DashboardFragment())
    }
}
```

---

## 12. Context и Resources

`Activity` и `JFragment` являются `Context` (через `ContextWrapper`).

```typescript
const ctx = this.ctx()                        // в Fragment
const ctx = this                              // в Activity

ctx.getString(R.lang.welcome_message)         // строка локализации
ctx.getResources()                            // BinaryResources
ctx.getApplicationContext()                   // Application

const res = this.getApplicationContext().getResources()
const fontData = res.getData(R.fonts.regular) // DataView — для addFontFace
```

---

## 13. Canvas и графика

```typescript
import {CanvasView} from "@casperui/core/view/widget/CanvasView"
import {Canvas} from "@casperui/core/graphics/Canvas"
import {Paint} from "@casperui/core/graphics/Paint"
import {Rect} from "@casperui/core/graphics/Rect"
import {Bitmap} from "@casperui/core/graphics/Bitmap"
import {Matrix} from "@casperui/core/graphics/Matrix"

const canvasView = new CanvasView(context)
container.addView(canvasView)

const canvas = canvasView.getCanvas()

const paint = new Paint()
paint.setColor("#3b82f6")
paint.setStrokeWidth(2)

canvas.drawRect(new Rect(10, 10, 100, 50), paint)
canvas.drawCircle(50, 50, 30, paint)
canvas.drawLine(0, 0, 100, 100, paint)
canvas.drawText("Hello", 20, 80, paint)

const bitmap = new Bitmap(200, 200)
new Canvas(bitmap).drawRect(new Rect(0, 0, 200, 200), paint)
canvas.drawBitmap(bitmap, 0, 0, null)

const matrix = new Matrix()
matrix.setScale(2, 2)
matrix.postTranslate(10, 10)
canvas.concat(matrix)
```

> Canvas требует попадания в DOM — инициализируйте в `onAttachSingle()`.

---

## 14. Паттерны и best practices

### Структура Fragment

```typescript
export class StatsFragment extends JFragment {

    private bind = R.layout.fragments.stats(this.ctx())
    private get main() { return this.getActivity() as MainActivity }

    onCreateView() { return this.bind.root }

    onCreated() {
        this.initFilters()
        this.subscribeToData()
        this.loadData()
    }

    onDetach() {
        // очистить интервалы, анимации
    }

    private initFilters() {
        const dr = this.bind.date_range as DateRangePicker
        dr.setOnChange(() => this.loadData())
    }

    private subscribeToData() {
        this.main.analyticsModel.tableData.observe(this, (data) => {
            this.renderTable(data)
        })
    }

    private async loadData() {
        const dr = this.bind.date_range as DateRangePicker
        await this.main.analyticsModel.load({
            from: formatDate(dr.getRange().start),
            to:   formatDate(dr.getRange().end),
        })
    }

    private renderTable(data: RowData[]) {
        const tbody = this.bind.table_body
        tbody.removeAllViews()
        for (const item of data) {
            const row = R.layout.table.stat_row(this.ctx())
            row.id_cell.setText(item.id)
            row.value_cell.setText(item.value.toString())
            tbody.addView(row.root)
        }
    }
}
```

### Эффективное обновление списка

```typescript
private rowCache = new Map<string, ReturnType<typeof R.layout.table.row>>()

updateList(data: Item[]) {
    // удалить исчезнувшие
    for (const [key, bind] of this.rowCache) {
        if (!data.find(d => d.id === key)) {
            this.container.removeView(bind.root)
            this.rowCache.delete(key)
        }
    }
    // обновить или создать
    for (const item of data) {
        if (!this.rowCache.has(item.id)) {
            const bind = R.layout.table.row(this.ctx())
            this.rowCache.set(item.id, bind)
            this.container.addView(bind.root)
        }
        const bind = this.rowCache.get(item.id)!
        bind.name.setText(item.name)
        bind.value.setText(item.value.toString())
    }
}
```

### Анимация числовых значений

```typescript
function animateValue(from: number, to: number, duration: number, onUpdate: (v: number) => void) {
    const start = performance.now()
    let raf: number
    function tick(now: number) {
        const t = Math.min((now - start) / duration, 1)
        onUpdate(from + (to - from) * (1 - Math.pow(1 - t, 3)))  // ease-out cubic
        if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
}

const cancel = animateValue(0, 1500, 800, (v) => {
    this.bind.counter.setText(Math.round(v).toString())
})
```

### Типичные ошибки

**Биндинг — поле класса, не локальная переменная:**
```typescript
// Плохо
onCreateView() {
    const bind = R.layout.fragments.profile(this.ctx())
    return bind.root
}

// Хорошо
private bind = R.layout.fragments.profile(this.ctx())
onCreateView() { return this.bind.root }
```

**Очистка в onDetach:**
```typescript
private intervals: ReturnType<typeof setInterval>[] = []

onCreated() {
    this.intervals.push(setInterval(() => this.tick(), 1000))
}

onDetach() {
    this.intervals.forEach(clearInterval)
    this.intervals = []
}
```

---

## Быстрый старт

### res/layout/root.html
```html
<div class="app-root" id="root">
    <div id="app_content" style="height:100%"></div>
</div>
```

### res/layout/main.html
```html
<div class="main-page" id="root">
    <h1 id="greeting"></h1>
    <button id="btn" class="btn">Нажми меня</button>
    <span id="counter">0</span>
</div>
```

### src/models/CounterModel.ts
```typescript
import {ViewModel} from "@casperui/core/live/ViewModel"
import {LiveData} from "@casperui/core/live/LiveData"

export class CounterModel extends ViewModel {
    count = new LiveData<number>(0)
    increment() { this.count.setValue(this.count.getValue() + 1) }
}
```

### src/view/fragments/MainFragment.ts
```typescript
import {JFragment} from "@casperui/core/app/JFragment"
import {View} from "@casperui/core/view/View"
import {R} from "@app/R"
import {MainActivity} from "@app/MainActivity"

export class MainFragment extends JFragment {
    private bind = R.layout.main(this.ctx())

    onCreateView(): View { return this.bind.root }

    onCreated() {
        const main = this.getActivity() as MainActivity
        this.bind.greeting.setText("Привет, мир!")
        main.counter.count.observe(this, (n) => this.bind.counter.setText(String(n)))
        this.bind.btn.setOnClickListener(() => main.counter.increment())
    }
}
```

### src/MainActivity.ts
```typescript
import {Activity} from "@casperui/core/app/Activity"
import {R} from "@app/R"
import {CounterModel} from "@app/models/CounterModel"
import {MainFragment} from "@app/view/fragments/MainFragment"

export class MainActivity extends Activity {
    counter = new CounterModel()

    async onCreate() {
        this.setContentView(R.layout.root(this).root)
        this.replaceFragment(R.id.app_content, new MainFragment())
    }
}
```

### src/main.ts
```typescript
import {Application} from "@casperui/core/app/Application"
import {MainActivity} from "@app/MainActivity"

const app = new Application()
window.onload = () => app.startActivity(new MainActivity())
```
