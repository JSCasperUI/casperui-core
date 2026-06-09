# CasperUI Core — API Reference (RU)

> Справочник по классам и методам `@casperui/core`.  
> Основан на исходном коде версии `0.0.19`.

---

## Содержание

- [View](#view)
- [ViewNode](#viewnode)
- [JFragment](#jfragment)
- [FragmentManager](#fragmentmanager)
- [Activity](#activity)
- [Application](#application)
- [LiveData\<T\>](#livedatat)
- [LiveDataObjectId\<T\>](#livedataobjectidt)
- [MappedLiveData\<T\>](#mappedliveda tat)
- [ViewModel](#viewmodel)
- [Context / ContextWrapper](#context--contextwrapper)
- [Resources / BinaryResources](#resources--binaryresources)
- [WidgetRegistrar](#widgetregistrar)
- [Rect](#rect)

---

## View

```typescript
import {View} from "@casperui/core/view/View"
```

Основной UI-компонент. Обёртка над DOM-элементом. Наследует `ViewNode`.

### Конструктор

```typescript
new View(context: Context, tag?: ViewTag, attr?: ViewAttributes)
```

| Параметр | Тип | Описание |
|---|---|---|
| `context` | `Context` | Контекст (Activity или Fragment) |
| `tag` | `string \| Element` | HTML-тег (`"div"`, `"input"`) или готовый DOM-элемент |
| `attr` | `ViewAttributes` | Атрибуты: `{ class, id, style, ... }` |

Если `tag` не указан — создаётся `<div>`.  
Если `tag` является `Element` — этот элемент оборачивается напрямую.

---

### Идентификатор

#### `getId(): number`
Возвращает числовой ID, присвоенный этому View (из `R.id`).

#### `setId(id: number): this`
Устанавливает числовой ID.

---

### Контекст

#### `ctx(): Context`
Возвращает контекст, с которым был создан View.

---

### Текст и значения

#### `setText(text: string): this`
Устанавливает `textContent`. Если первый дочерний узел — текстовый, обновляет его напрямую (быстрее).

#### `setTextContent(text: string)`
Устанавливает `textContent` (аналог `setText`, без кэша и без цепочки).

#### `getValue(): T`
Возвращает `.value` DOM-элемента (для `<input>`, `<textarea>`, `<select>`). Дженерик `T` по умолчанию `string`.

#### `setValue(value: T): this`
Устанавливает `.value` DOM-элемента через `String(value)`.

#### `setDefaultValue(value: T): this`
Сохраняет значение по умолчанию. Используется в связке с `resetValue()`.

#### `resetValue(): this`
Устанавливает значение равным сохранённому через `setDefaultValue`. Если default не задан — ничего не делает.

#### `setSafeValue(value: any): this`
Устанавливает значение через `setValue`, заменяя `null` и `undefined` на пустую строку.

#### `setChecked(value: boolean): this`
Устанавливает `.checked` DOM-элемента (`<input type="checkbox/radio">`).

#### `isChecked(): boolean`
Возвращает `.checked` DOM-элемента.

---

### Видимость и прозрачность

#### `show(): this`
Сбрасывает `style.display` (элемент становится видимым).

#### `hide(): this`
Устанавливает `style.display = "none"`.

#### `toggle(visible?: boolean): this`
Переключает видимость. Если `visible` передан явно — устанавливает его. Иначе инвертирует текущее.

#### `setVisibility(value: boolean): this`
`true` → `show()`, `false` → `hide()`.

#### `getVisibility(): boolean`
`true` если `style.display !== "none"`.

#### `setOpacity(value: number): this`
Устанавливает `style.opacity`. При `value === 1` очищает атрибут (не записывает `"1"`).

#### `getOpacity(): number`
Читает `style.opacity` через `parseFloat`.

---

### CSS-классы

#### `addClass(className: string): this`
Добавляет один CSS-класс.

#### `removeClass(className: string): this`
Удаляет один CSS-класс.

#### `hasClass(className: string): boolean`
Проверяет наличие CSS-класса.

#### `swapClass(removeClass: string, setClass: string): this`
Удаляет один класс и добавляет другой.

#### `addClassList(className: string): this`
Принимает строку с несколькими классами, разделёнными пробелами. Парсит и добавляет их через `classList.add(...args)` — оптимизированная версия для нескольких классов одновременно.

#### `activate(): this`
Добавляет класс `"active"`.

#### `deactivate(): this`
Удаляет класс `"active"`.

#### `isActive(): boolean`
Возвращает `hasClass("active")`.

---

### Размеры

#### `getWidth(): number`
Возвращает `clientWidth` DOM-элемента. **Требует нахождения в DOM** (иначе 0).

#### `getHeight(): number`
Возвращает `clientHeight` DOM-элемента. **Требует нахождения в DOM** (иначе 0).

#### `setWidth(width: number): this`
Устанавливает `style.width` в пикселях.

#### `setHeight(height: number): this`
Устанавливает `style.height` в пикселях.

---

### Позиция

#### `setLeft(value: number): this`
Устанавливает `style.left` в пикселях.

#### `getLeft(): number`
Читает `style.left`, парсит через `parseFloat`.

#### `setTop(value: number): this`
Устанавливает `style.top` в пикселях. Значение **кэшируется** внутри.

#### `getTop(): number`
Возвращает **кэшированное** значение top (не читает из DOM). Быстро, но актуально только если top менялся через `setTop`.

#### `getTopReal(): number`
Читает `style.top` из DOM напрямую. Медленнее `getTop()`, но всегда актуально.

#### `setTranslateY(value: number): this`
Устанавливает `style.transform = "translateY(Xpx)"`. Значение кэшируется.

#### `getTranslateY(): number`
Возвращает кэшированное значение `translateY`.

#### `getViewportRect(): Rect`
Вызывает `getBoundingClientRect()` и возвращает `Rect(x, y, x+width, y+height)` — координаты в viewport. **Требует нахождения в DOM**.

---

### Прокрутка

#### `getScrollY(): number`
Возвращает `scrollTop`.

#### `setScrollY(value: number): this`
Устанавливает `scrollTop`.

#### `getScrollX(): number`
Возвращает `scrollLeft`.

#### `setScrollX(value: number): this`
Устанавливает `scrollLeft`.

---

### Стили

#### `getStyle(): CSSStyleDeclaration`
Возвращает `style`-объект DOM-элемента для прямой работы.

#### `setStyle(key: string, value: string): this`
Устанавливает произвольное CSS-свойство: `view.setStyle("border-radius", "8px")`.

---

### Атрибуты

#### `setParameter(name: string, value: any): this`
Устанавливает HTML-атрибут через `setAttribute`.

#### `getParameter(name: string): string`
Читает HTML-атрибут через `getAttribute`.

#### `appendAttributes(attrs: object): this`
Применяет объект атрибутов. Ключи `"id"` и `"class"` обрабатываются отдельно (через `setId` и `addClassList`), остальные — через `setAttribute`.

---

### Контент

#### `html(content: string): this`
Устанавливает `innerHTML`. Используйте только для статичного HTML-контента.

#### `setSVGById(id: number): this`
Вставляет SVG-иконку по ID из ресурсов (`R.icons.*`). SVG клонируется из кэша — первый вызов с данным ID декодирует ресурс и кэширует результат.

#### `setImageSrc(url: string): this`
Устанавливает `src` DOM-элемента (для `<img>`).

---

### Анимация ошибки

#### `handleViewError(): this`
Убирает класс `"snake-anim"` и через 1 мс добавляет его обратно. Перезапускает CSS-анимацию. CSS для анимации нужно определить самостоятельно.

---

### Ожидание DOM

#### `waitingSelf(callback: () => void): this`
Если View уже в `document.body` — вызывает `callback` через `requestAnimationFrame`.  
Иначе подписывается на `MutationObserver` и вызывает `callback` в `rAF` при первом появлении в DOM. Повторные вызовы игнорируются пока `callback` ещё не выполнился.

---

### События

Все методы ниже используют внутри `makeSafeEvent`, который **заменяет** предыдущий обработчик того же типа при повторном вызове.

#### `setOnClickListener(func: (e: UIEvent) => any): this`
Подписка на событие `"click"`.

#### `setOnFastClickListener(func: (e: UIEvent) => any): this`
Подписка на `"mousedown"` — срабатывает быстрее клика, до `mouseup`.

#### `onMouseDownListener(func: (e: UIEvent) => any): this`
Подписка на `"mousedown"`.

#### `onMouseOverListener(func: (e: UIEvent) => any): this`
Подписка на `"mouseover"`.

#### `onMouseOutListener(func: (e: UIEvent) => any): this`
Подписка на `"mouseout"`.

#### `onMouseMoveListener(func: (e: UIEvent) => any): this`
Подписка на `"mousemove"`.

#### `onMouseDoubleClickListener(func: (e: UIEvent) => any): this`
Подписка на `"dblclick"`.

#### `onMouseClickListener(func: (e: UIEvent) => any): this`
Подписка на `"click"` (аналог `setOnClickListener`).

#### `vEvent(event: string, func: (e: UIEvent) => any, timeout?: number): this`
Подписка на произвольное DOM-событие. Если указан `timeout` (мс) — обработчик оборачивается в дебаунс: при повторном событии таймер сбрасывается.

#### `makeSafeEvent(type: string, func: (e: UIEvent) => any, timeout?: number): this`
Низкоуровневый метод. Снимает предыдущий обработчик этого типа (если был), затем добавляет новый. Callback оборачивается в `WeakRef` — не удерживает ссылку. Ссылка сохраняется в `_keeper_{type}`.

---

### Дочерние View

#### `addView(view: View, index?: number): this`
Добавляет дочерний View. Без `index` (или `-1`) — в конец. С `index` — вставляет по индексу через `insertBefore`.

#### `removeView(view: View): this`
Удаляет дочерний View. Если View не найден — ничего не делает.

#### `removeAllViews(): this`
Удаляет всех детей. Очищает `innerHTML`. Быстрее, чем удалять по одному.

#### `hasView(view: View): boolean`
Проверяет, является ли View прямым дочерним.

#### `indexView(view: View): number`
Возвращает индекс View в списке детей. `-1` если не найден.

#### `getChildren(): View[]`
Возвращает массив дочерних View. Не клонируется — не изменяйте напрямую.

#### `x(views: View[]): this`
Добавляет массив детей через `addView` и вызывает `onViewChildInflated()`. Используется в сгенерированных биндингах.

#### `onViewChildInflated()`
Вызывается после `x()`. Переопределите в виджете чтобы реагировать на завершение inflate дочерних элементов.

---

### Поиск в дереве

#### `byId(id: number): View | null`
Ищет View по числовому ID рекурсивно. Находит как элементы (`NodeType.ELEMENT`), так и текстовые узлы (`NodeType.TEXT`, созданные через `{{id}}`).

#### `byIds(ids: number[]): View[]`
Возвращает массив View по массиву ID. Обёртка над `byId`.

#### `byPath(path: number[]): View | null`
Находит View по пути индексов в дереве. `path = [0, 2, 1]` → первый ребёнок → его третий ребёнок → второй ребёнок. Пустой массив возвращает сам View.

---

### Навигация по дереву

#### `getFragmentManager(): IFragmentManager | null`
Поднимается вверх по `_parentView` пока не найдёт View с `isFragmentView() === true`. Возвращает его как `IFragmentManager`. Если не найден — `null`.

#### `getParentView(): IParentView | null`
Возвращает прямого родителя.

#### `setParentView(parentView?: IParentView): this`
Устанавливает родителя. Вызывается автоматически в `addView` / `removeView`.

#### `isFragmentView(): boolean`
Всегда `false` для базового `View`. В `Activity` и `JFragment` переопределён в `true`.

---

### Состояние

#### `isHovered(): boolean`
Возвращает `element.matches(':hover')`.

---

### Ref

#### `setRef<T>(ref: T): this`
Сохраняет произвольную ссылку внутри View. Полезно для привязки данных/объектов к конкретному View.

#### `getRef<T = unknown>(): T | null`
Возвращает ранее сохранённую ссылку.

---

### Замена DOM-узла

#### `replaceNode(newRootNode: View): this`
Заменяет `mNode` этого View на `mNode` из `newRootNode` и переносит его дочерних детей. Используется в виджетах для применения лейаута после `super()`.

---

### Доступ к DOM

#### `mNode: Node`
Прямой доступ к DOM-узлу. Используйте только когда API View недостаточно:
```typescript
view.mNode.addEventListener("touchstart", fn, { passive: true });
(view.mNode as HTMLInputElement).focus();
```

---

## ViewNode

```typescript
import {ViewNode} from "@casperui/core/view/nodes/ViewNode"
```

Базовый класс для `View`. Хранит `mNode` и `mType`.

### Константа

#### `static WIDGET_TAG = "WTAG"`
Специальный тег для виджетов без HTML-тега (создаётся без `document.createElement`).

### Методы

#### `getNode(): Node`
Возвращает `mNode` как `Node`.

#### `getElement(): HTMLElement`
Возвращает `mNode` как `HTMLElement`.

#### `setTextContent(text: string)`
Устанавливает `mNode.textContent`.

#### `setID(n: number)`
Устанавливает числовой ID.

### Поля

| Поле | Тип | Описание |
|---|---|---|
| `mNode` | `Node` | DOM-узел |
| `mType` | `NodeType` | Тип узла: `ELEMENT`, `TEXT`, `STYLE`, `SCRIPT`, `SVG` |

---

## JFragment

```typescript
import {JFragment} from "@casperui/core/app/JFragment"
```

Абстрактный класс. Строительный блок UI. Наследует `ContextWrapper`, реализует `ILiveManager`, `IFragmentManager`, `IParentView`.

### Константы

| Константа | Значение | Описание |
|---|---|---|
| `JFragment.POST_A_ATTACHED` | `1` | Первый раз прикреплён к DOM |
| `JFragment.POST_A_DETACHED` | `2` | Первый раз откреплён |
| `JFragment.POST_ATTACH` | `3` | Каждый раз прикреплён |
| `JFragment.POST_DETACH` | `4` | Каждый раз откреплён |

---

### Жизненный цикл (переопределяемые методы)

#### `abstract onCreateView(): View`
**Обязательный.** Вызывается один раз при первом `replaceFragment`. Должен вернуть корневой View фрагмента. DOM в этот момент ещё **не вставлен** в документ.

```typescript
onCreateView(): View {
    return this.bind.root
}
```

#### `onCreated(): void`
Вызывается один раз после `onCreateView()`, до вставки в DOM. Здесь инициализируют обработчики событий и подписки на `LiveData`.

#### `onAttachSingle(): void`
Вызывается **один раз** — при первом реальном попадании в DOM. Здесь безопасно читать размеры (`getWidth()`, `getHeight()`), инициализировать `<canvas>`, вызывать `focus()`.

#### `onAttach(): void`
Вызывается **каждый раз** при прикреплении к DOM (в том числе первый). LiveManager активируется **до** этого вызова.

#### `onDetach(): void`
Вызывается при откреплении. LiveManager деактивируется **после** этого вызова. Здесь очищают интервалы, анимации.

---

### Доступ к контексту и Activity

#### `ctx(): Context`
Возвращает базовый контекст (Activity или родительский фрагмент).

#### `getActivity(): Activity`
Возвращает Activity (каст `ctx()` к `Activity`). Удобно для доступа к моделям.

#### `getContext(): Context`
Аналог `ctx()`.

#### `getBaseContext(): Context`
Из `ContextWrapper`. Возвращает базовый контекст напрямую.

---

### Навигация

#### `replaceFragment(id: number, fragment: JFragment): void`
Заменяет фрагмент в контейнере с указанным `R.id`. Делегирует внутреннему `FragmentManager`.

#### `getFragmentManager(): FragmentManager`
Возвращает `FragmentManager` этого фрагмента (для управления вложенными фрагментами).

---

### Работа с View

#### `getView(): View`
Возвращает корневой View (результат `onCreateView()`).

#### `byId<T extends View = View>(id: number): T`
Ищет View по ID в дереве этого фрагмента. Ищет в корневом View через `byId`.

#### `byIds(ids: number[]): View[]`
Возвращает массив View по ID.

---

### Отложенный запуск

#### `postAttach(func: () => void): void`
Выполняет `func` когда фрагмент первый раз прикреплён к DOM (`POST_A_ATTACHED`). Если уже прикреплён — выполняет немедленно.

#### `getPostActions(): PostAction<number>`
Возвращает объект `PostAction`. Позволяет подписаться на любые константы жизненного цикла:
```typescript
this.getPostActions().run(JFragment.POST_ATTACH, () => {
    // каждый раз при attach
})
```

---

### Слушатели прикрепления

#### `addAttachEventListener(listener: () => void): void`
Добавляет функцию, которая вызывается при каждом `attach()`. В отличие от `onAttach()` — можно добавить из внешнего кода.

---

### Отслеживание размеров

#### `setSizeChangeListener(handler: (width: number, height: number) => void): void`
Подписывается на изменения размеров корневого View через `ResizeObserver`. Callback вызывается только когда фрагмент прикреплён. При повторном вызове — старый обсервер отключается.

---

### Состояние

#### `isFragmentAttached(): boolean`
`true` если фрагмент прикреплён к DOM.

#### `isFragmentCreated(): boolean`
`true` если `onCreateView()` уже был вызван.

---

### Родительский фрагмент

#### `getParentFragment(): JFragment | null`
Возвращает родительский фрагмент (через `WeakRef`). `null` если родитель — Activity.

---

## FragmentManager

```typescript
import {FragmentManager} from "@casperui/core/app/FragmentManager"
```

Управляет жизненным циклом и вложением фрагментов в контейнеры. Доступен через `activity.getFragmentManager()` или `fragment.getFragmentManager()`.

### `replaceFragment(containerId: number, fragment: JFragment, container?: View): void`
Заменяет текущий фрагмент в контейнере на новый.
- Старый фрагмент получает `detachFragment()` → `onDetach()`.
- Если новый фрагмент ещё не создавался — вызываются `startCreatingView()` → `onCreated()`.
- Новый фрагмент добавляется в контейнер.
- Если менеджер активен (`isAttached`) — новый фрагмент сразу получает `attach()`.
- Если старый === новому — ничего не происходит.

#### `container` (опционально)
Если не передан — ищется через `manager.getView().byId(containerId)`.

---

### `pushFragment(containerId: number, fragment: JFragment, container?: View): void`
Добавляет фрагмент в контейнер **только если контейнер пуст**. Если уже есть фрагмент — ничего не делает.

---

### `dropFragment(fragment: JFragment, container?: View): void`
Удаляет фрагмент из контейнера. Вызывает `detachFragment()`, убирает из DOM и из памяти.

---

### `swapInContainer(oldFragment: JFragment, newFragment: JFragment, container: View): void`
Заменяет `oldFragment` на `newFragment` в указанном контейнере по индексу позиции старого. Старый детачится, новый добавляется на то же место.

---

### `getIdByFragment(fragment: JFragment): number`
Возвращает ID контейнера, в котором находится фрагмент. `-1` если не найден.

---

## Activity

```typescript
import {Activity} from "@casperui/core/app/Activity"
```

Наследует `ContextWrapper`. Реализует `ILiveManager`, `IFragmentManager`, `IParentView`.

### Жизненный цикл

#### `onCreate(): void`
Переопределите для инициализации UI. Вызывается фреймворком при `startActivity()`.

#### `onLayout(): void`
Вызывается после `setContentView()`. Переопределите для логики после установки лейаута.

---

### UI

#### `setContentView(layout: View): void`
Очищает `document.body` и добавляет `layout` как корневой View. После этого вызывает `onLayout()`.

#### `getWindowView(): View`
Возвращает View, обёртывающий `document.body`.

#### `getView(): View`
Аналог `getWindowView()`.

---

### Поиск View

#### `byId(id: number): View`
Ищет View по ID во всём дереве `document.body`.

#### `byPath(path: number[]): View | null`
Ищет View по пути индексов от корня.

---

### Навигация

#### `replaceFragment(id: number, fragment: JFragment): void`
Устанавливает фрагмент в контейнер с указанным `R.id`.

#### `getFragmentManager(): FragmentManager`
Возвращает корневой `FragmentManager`.

---

### Контекст

#### `getApplicationContext(): Application`
Возвращает `Application`.

#### `getResources(): Resources`
Возвращает ресурсы через цепочку контекстов.

---

### Inflate

#### `getLayoutInflater(): BXMLInflater`
Возвращает `BXMLInflater` (устаревший, не используется для обычного inflate).

#### `getInflater(): BXMLInflater`
Аналог выше.

---

### LiveData

Activity реализует `ILiveManager`, поэтому в ней можно вызывать `liveData.observe(this, callback)`.

---

## Application

```typescript
import {Application} from "@casperui/core/app/Application"
```

### `startActivity(activity: Activity): Promise<void>`
Ожидает загрузки ресурсов, прикрепляет контекст к Activity, вызывает `activity.createActivity()`.

### `getResources(): Resources`
Возвращает `BinaryResources`.

### `getApplicationContext(): this`
Возвращает себя.

### `addFontFace(family: string, data: DataView, descriptors?: FontFaceDescriptors): void`
Регистрирует шрифт через `document.fonts.add(new FontFace(...))`.

```typescript
const res = app.getResources()
app.addFontFace("ui", res.getData(R.fonts.regular))
app.addFontFace("ui", res.getData(R.fonts.bold), { weight: "700" })
```

---

## LiveData\<T\>

```typescript
import {LiveData} from "@casperui/core/live/LiveData"
```

Реактивный контейнер значения. Уведомляет всех активных наблюдателей при изменении.

### Конструктор

```typescript
new LiveData<T>(initialValue: T)
```

---

### Чтение

#### `getValue(): T`
Возвращает текущее значение.

#### `getOriginalValue(): T`
Аналог `getValue()`. Переопределяется в `MappedLiveData`.

#### `getCaller(): any`
Возвращает `caller`, переданный в последний вызов `setValue` / `pushValueToArray`.

---

### Изменение

#### `setValue(newValue: T, caller?: any): void`
Устанавливает значение и уведомляет всех активных наблюдателей. `caller` — произвольный объект, идентифицирующий источник изменения.

#### `setIfChanged(newValue: T, caller?: any): void`
Устанавливает значение **только если** `newValue !== mValue` (строгое сравнение). Уведомляет наблюдателей.

#### `update(): void`
Уведомляет наблюдателей **без изменения** значения. Используйте когда мутируете объект/массив напрямую:
```typescript
const arr = model.items.getValue()
arr.push(newItem)
model.items.update()
```

#### `pushValueToArray(item: T, caller?: any): void`
Если текущее значение — массив, вызывает `push(item)` и уведомляет наблюдателей. Для других типов — ничего не делает.

---

### Подписка

#### `observe(observer: ILiveManager, callback: (value: T, caller: any) => void): void`
Подписывает `observer` на изменения. `Activity` и `JFragment` реализуют `ILiveManager`.

- Callback **привязывается** к `observer` через `bind` — `this` внутри callback будет observer.
- Callback вызывается **сразу** при подписке, если observer активен (`hasActive()`).
- При деактивации observer (уход фрагмента) callbacks не вызываются.
- Использует `WeakRef` для ссылок — не вызывает утечек памяти.

```typescript
model.count.observe(this, (value, caller) => {
    this.bind.label.setText(String(value))
})
```

#### `removeObserver(observer: ILiveManager): void`
Метод заглушка (не реализован в текущей версии).

---

### Уведомление

#### `notifyObservers(): void`
Обходит всех наблюдателей и вызывает callback у активных. Мёртвые `WeakRef` удаляются автоматически.

#### `notifyObserver(observer: LiveManager): void`
Уведомляет только конкретного наблюдателя.

#### `clearPublishHistory(): void`
Сбрасывает историю публикаций. Вызывается перед каждым `notifyObservers()` чтобы каждый observer получил уведомление заново.

---

## LiveDataObjectId\<T\>

```typescript
import {LiveDataObjectId} from "@casperui/core/live/LiveDataObjectId"
```

Наследует `LiveData<T>`. Оптимизирован для массивов объектов с полем `_id`. Хранит `idHashMap` — быстрый индекс по `_id`.

### Дополнительные методы

#### `getValueIndexById(id: string): number`
Возвращает индекс объекта с данным `_id` в массиве.

#### `getValueByObjectId(id: string): any`
Возвращает объект по его `_id`.

#### `updateIdMap(): void`
Перестраивает `idHashMap`. Вызывается автоматически в `setValue`.

### Переопределения

#### `setValue(newValue: T): void`
Дополнительно вызывает `updateIdMap()` если значение изменилось.

#### `pushValueToArray(item: { _id: string }): void`
Добавляет элемент и обновляет `idHashMap[item._id]`.

---

## MappedLiveData\<T\>

```typescript
import {MappedLiveData} from "@casperui/core/live/MappedLiveData"
```

Наследует `LiveData`. Хранит массив объектов и дополнительно строит `mappedValue` — объект с индексацией по `mapField`.

### Конструктор

```typescript
new MappedLiveData<T>(initialValue: T, mapField: string)
```

`mapField` — имя поля, по которому строится индекс (например `"id"` или `"_id"`).

### Поля

#### `mappedValue: Record<string, any>`
Объект вида `{ [item[mapField]]: item }` для быстрого поиска по полю.

### Переопределения

#### `setValue(newValue): void`
Пересчитывает `mappedValue` через `ArrayToObjectID(newValue, mapField)` перед уведомлением.

---

## ViewModel

```typescript
import {ViewModel} from "@casperui/core/live/ViewModel"
```

Пустой базовый класс. Используйте для организации бизнес-логики и LiveData-полей.

```typescript
export class UsersModel extends ViewModel {
    users     = new LiveData<User[]>([])
    isLoading = new LiveData<boolean>(false)

    async load() {
        this.isLoading.setValue(true)
        // ...
        this.isLoading.setValue(false)
    }
}
```

---

## Context / ContextWrapper

```typescript
import {Context} from "@casperui/core/content/Context"
import {ContextWrapper} from "@casperui/core/content/ContextWrapper"
```

`Context` — абстрактный класс. `ContextWrapper` — реализует делегирование к базовому контексту.

`Activity`, `JFragment`, `Application` — все наследуют `ContextWrapper`.

### Методы Context

#### `getResources(): Resources`
Возвращает объект ресурсов.

#### `getApplicationContext(): Context`
Возвращает `Application`.

### Методы ContextWrapper

#### `attachBaseContext(context: Context): void`
Устанавливает базовый контекст. Вызывается фреймворком автоматически.

#### `getBaseContext(): Context`
Возвращает базовый контекст.

---

## Resources / BinaryResources

```typescript
import {BinaryResources} from "@casperui/core/content/BinaryResources"
```

Доступ к скомпилированным ресурсам из `res.html`.

Получить:
```typescript
const res = this.getApplicationContext().getResources()
// или
const res = this.ctx().getResources()
```

### Методы

#### `getString(id: number): string`
Возвращает строку локализации по ID (`R.lang.*`). Язык определяется текущей локалью.

#### `setLocale(value: string): void`
Переключает язык: `"ru"`, `"en"` и т.д.

#### `getBufferById(id: number): ByteBuffer`
Возвращает `ByteBuffer` для ресурса с данным ID. Используется внутри `_getLayCTX` при inflate. Каждый вызов сбрасывает позицию чтения.

#### `getDataString(id: number, cache?: boolean): string`
Читает ресурс как UTF-8 строку. По умолчанию кэшируется (второй вызов возвращает из кэша). Используется для SVG и других текстовых ресурсов.

#### `getSvgUrlBase64(id: number, cache?: boolean): string`
Возвращает строку вида `url(data:image/svg+xml;base64,...)`. Подходит для CSS `background-image`.

#### `getSVGImageBlob(id: number): string`
Возвращает объектный URL (`blob:...`) для SVG-иконки. Кэшируется. Подходит для `<img src>`.

#### `initResources(dataFile: ArrayBuffer): void`
Инициализирует ресурсы из загруженного `res.html`. Вызывается внутри `Application` автоматически.

> **Примечание:** метода `getData()` в текущей версии нет в публичном API `Resources`. Для шрифтов используйте `getBufferById(id).toDataView()` или аналогичный метод `ByteBuffer`.

---

## WidgetRegistrar

```typescript
import {WidgetRegistrar} from "@casperui/core/view/inflater/WidgetRegistrar"
```

Глобальный реестр кастомных виджетов. Связывает HTML-тег с конструктором View.

### `register(className: string, constructor: ViewConstructor): void`
Регистрирует виджет. `className` — тег в HTML-лейауте. `constructor` — фабричная функция:

```typescript
type ViewConstructor = (context: Context, tag: string, attributes: ViewAttributes) => View
```

```typescript
WidgetRegistrar.register("MyWidget", (ctx, tag, attr) => new MyWidget(ctx, tag, attr))
```

### `createInstance(className: string, context: Context, tag: string, attributes: ViewAttributes): View`
Создаёт экземпляр по имени класса. Если класс не зарегистрирован — создаёт обычный `View` с указанным тегом. Используется внутри `_getLayCTX` при inflate.

---

## Rect

```typescript
import {Rect} from "@casperui/core/graphics/Rect"
```

Прямоугольник. Используется для координат, размеров, отступов.

### Конструктор

```typescript
new Rect(left: number, top: number, right: number, bottom: number)
```

### Поля

| Поле | Тип |
|---|---|
| `left` | `number` |
| `top` | `number` |
| `right` | `number` |
| `bottom` | `number` |

### Методы

#### `getWidth(): number` → `right - left`
#### `getHeight(): number` → `bottom - top`

#### `width(width: number): number`
Устанавливает `right = left + width`. Возвращает новый `right`.

#### `height(height: number): number`
Устанавливает `bottom = top + height`. Возвращает новый `bottom`.

#### `set(left, top, right, bottom): void`
Устанавливает все четыре поля.

#### `setRect(rect: Rect): void`
Копирует значения из другого Rect.

#### `setAll(value: number): void`
Устанавливает все четыре поля в одно значение.

#### `setUpDown(value: number): void`
Устанавливает `top` и `bottom`.

#### `setLeftRight(value: number): void`
Устанавливает `left` и `right`.

#### `reset(): void`
Обнуляет все поля.

#### `getPoint(): Point`
Возвращает `{ x: left, y: top }`.

#### `clipClamp(left, top, right, bottom): void`
Ограничивает Rect переданными границами: `left = max(this.left, left)`, `right = min(this.right, right)` и т.д.

#### `isZero(): boolean`
`true` если все поля равны `0`.

#### `isEmpty(): boolean`
`true` если `left >= right` или `top >= bottom`.

#### `equals(rect: Rect): boolean`
Сравнивает все четыре поля.

#### `eq(rect: Rect): boolean`
Аналог `equals`.

#### `match(left, top, right, bottom): boolean`
Сравнивает с отдельными числами.

---

## Типы

### `ViewTag`
```typescript
type ViewTag = string | Element
```
Первый аргумент конструктора `View`. Строка тега или готовый DOM-элемент.

### `ViewAttributes`
```typescript
type ViewAttributes = Record<string, string | number | boolean>
```
Объект HTML-атрибутов. Ключи `"id"` и `"class"` обрабатываются особо (см. `appendAttributes`).

### `ObserverCallback<T>`
```typescript
type ObserverCallback<T> = (value: T, caller: any) => void
```
Тип callback для `LiveData.observe`.

### `FragmentResizeHandler`
```typescript
type FragmentResizeHandler = (newWidth: number, newHeight: number) => void
```
Тип callback для `JFragment.setSizeChangeListener`.

### `ViewConstructor`
```typescript
type ViewConstructor = (context: Context, tag: string, attributes: ViewAttributes) => View
```
Тип фабричной функции для `WidgetRegistrar.register`.
