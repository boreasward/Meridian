# 设计规范

溯风工作室中后台页面（Svelte 5 + Tailwind v4 + shadcn-svelte / Bits UI）的设计规则：原则、令牌、应用壳、页面骨架、状态词汇、数据块五态、组件清单、交互、文案与格式、品牌、守护。这是唯一的一份：Windrose、Bearing 等项目的文档只写本项目多出来的部分（自己的令牌、状态词表、领域组件、产品规则），其余以本文为准。

本文是活的：组件、令牌、壳或交互规则变了，与代码同一个提交更新本文，并写进 `CHANGELOG.md`。

**看效果**：`cd web && npm install && npm run dev`，画廊里有令牌、全部通用组件、状态与数据块五态、页面骨架，浅 / 深色可切换。画廊自己就跑在 `AppShell` 里。

**文件归属**：本文提到的文件分三类。同步文件由 Meridian 维护，在项目里是只读的（项目的 `web/meridian.lock.test.js` 逐字节检查）；项目扩展文件的路径和导出形状由 Meridian 规定、内容归项目（第 11 节）；其余是项目自有。清单见 `meridian.manifest.json`。

## 1. 原则

1. **先把状态说清，再谈好看。** 每个取数的块必须能表达五态之一：加载中 / 无数据 / 没算 / 降级 / 失败（第 6 节）。没有「看起来正常但其实是空」。
2. **一致胜于新颖。** 同一含义一个写法、一个颜色、一个组件，在一个项目里如此，跨项目也如此。新需求先查本文，没有再加组件并更新本文。
3. **页面只组合原语。** 页面用通用层和领域层的组件拼出来，不自己写颜色、间距的特例，不写 `<style>`。
4. **数据里来的文字一律按文字显示。** 不用 `{@html}`；数据里来的地址只经 `ExternalLink`。
5. **可读的中文。** 界面文字用简体中文；全角标点、「」作引号、中西文与数字之间半角空格；时间写明时区（第 9 节）。
6. **只用构建里的资源。** 字体与图标来自 npm 包并打进产物，运行时不加载外部脚本、字体或图片。

## 2. 设计令牌

底座令牌的值在 `web/src/styles/tokens.css`，`web/src/styles/app.css` 用 `@theme inline` 映射成 Tailwind 类（`bg-card`、`text-muted-foreground`、`border-border`……）。**一律十六进制**（`#rrggbb` / `#rrggbbaa`）。只采用 shadcn 的命名，不采用其默认取值；没有 `--secondary`、`--accent`、`--sidebar-*`（`tokens.test.ts` 检查）。

项目自己的令牌（例如行情的涨跌色、图表色）写在项目的 `web/src/styles/project.css`，连同它们的 `@theme inline` 映射；`app.css` 会导入这个文件。规则相同：十六进制、浅深两套都定义、组件里只引用令牌。

| 类别 | 令牌 | 规则 |
| --- | --- | --- |
| 表面 | `--background`、`--card`、`--muted`、`--border`、`--ring` | 页面底、卡片 / 表面、次级表面、边框、焦点圈；另有 `--popover`、`--input` 给浮层与输入框 |
| 文字 | `--foreground`、`--muted-foreground` | 正文与次要文字两级，不再有第三种灰。`muted` 是次级**表面**，次要**文字**是 `text-muted-foreground` |
| 强调 | `--primary` / `--primary-foreground` | 唯一的强调色（浅色墨黑，深色反色），用于主按钮、品牌标记 |
| 状态 | `--success`、`--warn`、`--destructive`、`--info`、`--running`、`--neutral` 各带 `-foreground` | 对应六种语气（第 5 节）；页面里不得出现原色类名（`red-600`、`amber-700`……） |
| 字号 | `text-xs` 12 / `text-sm` 13 / `text-base` 14 / `text-lg` 16 / `text-xl` 20（行高 16 / 18 / 20 / 24 / 28） | 页面正文 `text-sm`，表格 `text-xs` 或 `text-sm`，页面标题 `text-xl`（`PageHeader` level 1），段标题 `text-lg` 及以下；不用 `text-2xl` 以上 |
| 间距 | Tailwind 4px 基数 | 组件内 `1 / 2 / 3`，卡片内 `3`，块间 `4`，页内分段 `6`（`Page` 给）。不用 `gap-5`；`gap-8` 只用在一页里两个无关区域之间；不写自定义间距值 |
| 圆角 | 控件 `--radius` 8px，卡片 / 输入框 12px（`rounded-xl`） | `rounded-xs/sm/md/lg` → 8px，`rounded-xl` → 12px，`rounded-2xl/3xl/4xl` → 14px；`rounded-full` 不变 |
| 阴影 | `--shadow-1`、`--shadow-2` 只给 Popover / Sheet / Dialog / Toast 等浮层 | 卡片、按钮与输入框无阴影 |
| 动效 | 过渡 150ms，仅颜色与透明度；运行中状态用边框脉冲 `animate-running` | 没有进场动画；`prefers-reduced-motion` 时全部关闭 |
| 深浅色 | `[data-theme]`（`light` / `dark`）两套令牌值 | 首次打开跟随系统，用户切换后记本地（`lib/theme.ts`，键 `theme`）；两套都满足 WCAG AA（正文 4.5:1、次要文字 3:1），每个状态色在两套里各调一次 |

### 取值

| 令牌 | 浅色 | 深色 |
| --- | --- | --- |
| `--background` | `#fafafa` | `#0f0f0f` |
| `--card` / `--card-foreground` | `#ffffff` / `#1a1a1a` | `#171717` / `#ededed` |
| `--popover` / `--popover-foreground` | `#ffffff` / `#1a1a1a` | `#171717` / `#ededed` |
| `--muted` | `#f2f2f2` | `#222222` |
| `--border` / `--input` / `--ring` | `#ececec` / `#e0e0e0` / `#1a1a1a` | `#2a2a2a` / `#3a3a3a` / `#ededed` |
| `--foreground` | `#1a1a1a` | `#ededed` |
| `--muted-foreground` | `#6b6b6b` | `#9a9a9a` |
| `--primary`（`-foreground`） | `#1a1a19`（`#ffffff`） | `#ededed`（`#111111`） |
| `--success`（`-foreground`） | `#15803d`（`#ffffff`） | `#22c55e`（`#052e16`） |
| `--warn`（`-foreground`） | `#b45309`（`#ffffff`） | `#f59e0b`（`#1c1002`） |
| `--destructive`（`-foreground`） | `#dc2626`（`#ffffff`） | `#f87171`（`#2a0a0a`） |
| `--info`（`-foreground`） | `#1d4ed8`（`#ffffff`） | `#60a5fa`（`#0a1a33`） |
| `--running`（`-foreground`） | `#6d28d9`（`#ffffff`） | `#a78bfa`（`#1e1136`） |
| `--neutral`（`-foreground`） | `#475569`（`#ffffff`） | `#94a3b8`（`#0b0f14`） |
| `--shadow-1` / `--shadow-2` | `0 1px 2px rgba(15,23,42,.06)` / `0 14px 35px rgba(15,23,42,.08)` | `0 1px 2px rgba(0,0,0,.4)` / `0 14px 35px rgba(0,0,0,.5)` |
| `--radius` | `8px`（只在 `:root`，形状不随主题变） | |

`tokens.test.ts` 逐条断言：颜色令牌全是十六进制；浅深两套令牌集合一致；`foreground` 在 `background` / `card` 上 ≥ 4.5、`muted-foreground` ≥ 3；`primary` 与各状态色作文字落在 `--card` 上 ≥ 4.5；各 `*-foreground` 落在它的底色上 ≥ 4.5；`app.css` 里每个 `--color-x: var(--x)` 都对应两套里已定义的令牌。

标题（`PageHeader`、`Section`、`Card` 标题、壳里的字标与面板标题）统一 `font-serif font-semibold`：`"Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", Georgia, serif`；正文 Inter（`@fontsource/inter`，本地包）加中文系统字体栈。

状态色淡底上的同色文字达不到 AA，所以 `StatusPill` 的文字用 `text-foreground`，语气由圆点、边框和 10% 淡底表达。数字默认等宽（`body` 上的 `tabular-nums`）。

## 3. 应用壳

所有项目用同一个壳 `lib/shell/AppShell.svelte`：左栏、顶栏、内容区，右侧抽屉可选。壳不取业务数据、不认识任何路由，项目把导航和片段交给它。

```
+----------+----------------------------------------------------+
| 标记 字标 | [标题] 上下文          状态 | 面板开关 | 深浅色切换 |
+----------+-------------------------------------+--------------+
| 导航项    |                                     |              |
| 导航项    |               内容区                |  抽屉（可选） |
| ……       |                                     |              |
+----------+                                     |              |
| 设置      |                                     |              |
| 折叠按钮  |                                     |              |
+----------+-------------------------------------+--------------+
```

**尺寸**：左栏展开 208px（`w-52`）/ 折叠 56px（`w-14`）；抽屉 288px（`w-72`）；顶栏与左栏的品牌行都是 48px。

| prop | 类型 | 说明 |
| --- | --- | --- |
| `brand` | `{ name: string; mark: Snippet }` | 左栏顶部：标记 + 衬线字标；折叠时只剩标记（第 10 节） |
| `nav` | `NavItem[]` | 主导航。`NavItem = { label, icon, href?, onclick?, current?, badge?, badgeLabel? }`；有 `href` 是链接，否则是动作（`onclick` 收到被点的元素） |
| `footerNav` | `NavItem[]`（可选） | 左栏底部。**「设置」放这里**；点开是页面还是 `Sheet` 由项目定 |
| `railBody` | `Snippet<[{ collapsed, close }]>`（可选） | 替换主导航区域（例如「快捷入口 / 对话」两段）；其中的入口列表仍用 `NavList` |
| `title` | `string`（可选） | 顶栏里的 `h1`。**只在页面没有 `PageHeader` 时传**（例如对话页） |
| `context` | `Snippet`（可选） | 顶栏左侧的次要信息（数据时点、市场开关之类） |
| `status` | `Snippet`（可选） | 顶栏右侧的项目状态（例如「每日任务运行中」徽标） |
| `panes` + `drawer` | `{ id, label, icon }[]` + `Snippet<[id]>`（可选） | 右侧抽屉的面板。不给 `drawer` 就没有抽屉，也没有面板开关 |
| `defaultPane` | `string \| null`（可选） | 用户还没选过时，宽屏上默认打开的面板；缺省不打开 |
| `banner` | `Snippet`（可选） | 内容区上方的全局提示（例如连不上服务） |
| `children` | `Snippet` | 内容区，渲染在壳提供的 `<main>` 里；项目不要再包一层 `<main>` |

另导出 `dismissOverlay()`：窄屏下关掉 `Sheet`、等它真正关完，并且不把焦点还给触发按钮（调用方接着要聚焦内容里的东西）；宽屏上立刻返回。

**固定行为**

- 导航项一律是图标 + 文字，当前项 `bg-muted` 加粗；链接带 `aria-current="page"`。折叠时只显示图标，文字进 `title`，角标变成圆点。
- 顶栏右侧的顺序固定：项目状态、面板开关、分隔线、深浅色切换。深浅色切换由壳自带。
- 左栏底部自下而上：折叠按钮、`footerNav`。
- 宽屏上，左栏是否折叠与打开的面板记在本机（键 `ws.nav.collapsed`、`ws.drawer`）；存储不可用时仍能用。
- **窄屏（小于 1024px）**：左栏与抽屉共用一个 `Sheet`，同时只开一个；顶栏左侧多一个「打开导航」按钮。窄屏上打开什么不记忆，也不改宽屏的偏好。关闭后焦点回到触发按钮。
- 底色：左栏、顶栏、抽屉、内容区都是 `bg-background`，彼此用 1px `border-border` 分隔。

`NavRail`、`NavList`、`TopBar`、`Drawer` 是壳的组成部分，页面不直接用；`railBody` 里可以用 `NavList`。

## 4. 页面骨架

| 规则 | 写法 |
| --- | --- |
| 页面容器 | 每个页面的根是 `<Page>`（`lib/ui/domain/Page.svelte`）：`mx-auto grid w-full max-w-6xl gap-6 p-4 lg:p-6`。自己管列的页面（两栏工作台、对话）传 `width="full"`。页面自己不写外边距和最大宽度 |
| 标题 | 每页恰好一个 `h1`，来自 `PageHeader level={1}`；次要信息（日期、时区、口径）写在它的 `meta`；右侧动作区至多一个主按钮。没有 `PageHeader` 的页面（对话）由壳的 `title` 提供 `h1` |
| 分段 | `Section`（标题 + 可选说明 + 动作 + 内容），不嵌套超过两层 |
| 数据容器 | 一类数据（一张表、一组指标、一个表单）一张 `PageCard`。**表格一律在 `PageCard` 里**（表格的吸顶表头是 `bg-card`）。不把列表的每一行做成一张卡。需要标题加说明时用 `Section` 给标题、里面的 `PageCard` 不带标题；页面只有一个数据块时 `PageCard` 也可以不带标题 |
| 网格 | 卡片并排用 `grid gap-4 md:grid-cols-2`（或按容器宽度）；窄屏单栏 |
| 窄屏的表 | 字段多的表用 `DataTable cards="narrow"` 行转卡（小于 768px），判断窄屏用 `useNarrow()` |
| 取数 | 取数的块用 `ResourceBlock`（第 6 节） |

## 5. 状态词汇

全站状态词在一张表里：`{ 域, 键 } → { 语气, 中文 }`。`StatusPill` 只认这张表，**不认识的键在开发模式抛错（`unknown status: <域>.<键>`），在生产显示中性灰加原键**。颜色只表达语气，**文字必须同时出现**。

表由两部分合成（`lib/ui/domain/status.ts`）：底座的 `block` 域，加项目的 `lib/app/status.ts`（`TONES`、`LABELS`、`labelText`）。键名照各项目自己的接口，不跨项目统一；统一的是语气和用词。

| 语气 | 令牌 | 用于 |
| --- | --- | --- |
| `success` | `--success` | 完成、生效、已配置、正常 |
| `warn` | `--warn` | 部分失败、降级、未完成、没算、样本不足 |
| `danger` | `--destructive` | 失败 |
| `info` | `--info` | 待审核、待处理、提示类 |
| `running` | `--running` | 运行中（带脉冲） |
| `neutral` | `--neutral` | 已中断、跳过、未开始、已结束、已停用、未配置 |

**底座域** `block`：`not_computed` →「没算」，`insufficient` →「样本不足」，都是 `warn`。项目词表不得重新定义它。

**同一含义同一个词**（各项目的词表都这样写）：

| 含义 | 中文 | 语气 |
| --- | --- | --- |
| 成功结束 | 完成 | `success` |
| 一部分失败 | 部分失败 | `warn` |
| 失败 | 失败 | `danger` |
| 进行中 | 运行中 | `running` |
| 被打断 | 已中断 | `neutral` |
| 没开始 | 未开始 | `neutral` |
| 跳过 | 跳过 | `neutral` |

**维护项目词表**（`lib/app/status.ts`）：

1. 多了一个状态值：在 `TONES` 对应域里加键（**每个域保持单行** `domain: { key: 'tone', … },`，不用展开运算符），再在 `LABELS` 里补中文，然后才在页面里用。
2. 新域：`TONES`、`LABELS` 各加一行；`StatusDomain` 类型自动推出。
3. 带数字或占位符的文案（「3 个待审核」）：`StatusPill` 的 `text` 传填好的句子，语气仍取自表。
4. 同一个键在不同域可以有不同语气或中文，按域区分。
5. `labelText(text)` 是项目对一切状态文字的最后一道改写（例如某个市场把同一样东西叫另一个名字）；没有要改的就原样返回。

`lib/ui/domain/status.app.test.ts` 在每个项目里检查词表的形状：两张表的域与键一致、每个键有中文和合法语气、没有重新定义底座域、每个域一行。词表里具体有哪些词，由项目自己的测试断言。

## 6. 数据块五态与取数

所有取数的块用 `DataBlock`（`lib/ui/domain/DataBlock.svelte`）表达状态，不自己写「加载中…」「没有数据」。

| 状态 | 表现 | 文案规则 |
| --- | --- | --- |
| `loading` | 骨架（`skeleton`：`row` / `block` / `table`），`aria-busy` | 不出现文字「加载中…」 |
| `empty` | 一行次要文字 | 写**为什么空**：「今天没有内容」「还没有运行记录」 |
| `not_computed` | 一行次要文字 + `warn` 徽标「没算」 | 写**缺什么**，与 `empty` 严格区分 |
| `degraded` | 内容照常显示 + 顶部 `Alert`（warn） | 写**哪部分不全**与原因 |
| `error` | `Alert`（danger）+ 重试按钮（若可重试） | 中文原因，不显示英文码与堆栈 |

另有 `ready`：只渲染内容。`page` 属性让页面级的 `loading` / `empty` / `not_computed` / `error` 撑满内容区并居中。**调用方必须给 `empty` / `not_computed` 传 `message`**；组件内的默认文案（「暂无数据」「部分数据不全」「加载失败」）只是兜底，页面上出现兜底文案就是漏写。**禁止用空白、`—`、`null`、`undefined` 表达以上任一态。**

**共享资源**（`lib/stores/resource.svelte.ts`）：`createResource<T>(path, { emptyWhen? })` 返回 `{ data, state, error, failure, load(), invalidate(), reset() }`。

- 在组件里读它的属性即订阅并自动加载；一个接口一个共享资源，写入成功后 `invalidate()`。
- 已有数据时重新加载（轮询、写入后刷新）**不回到 `loading`**，`state` 保持 `ready`，新结果或错误到了再变，页面不闪骨架屏。
- `failure` 是最近一次**已结束**的加载的错误文案，重试进行中也保留，成功后清空（给常驻的「连不上」提示用，不会随轮询闪烁）。
- `reset()` 丢掉数据与错误并让进行中的请求作废（切换数据范围时用，旧数据一个字都不再显示）。
- `emptyWhen(cause)` 让项目把某些失败当作「还没有数据」，资源变成 `empty` 而不是 `error`。
- 取数与失败的措辞归项目：资源只用 `$lib/api` 的 `get(path)` 和 `errorText(cause)`（第 11 节）。

取数的页面用 `ResourceBlock{resource, emptyMessage}`（`lib/views/ResourceBlock.svelte`）：它把资源的 `loading` / `ready` / `error` / `empty` 交给 `DataBlock`，错误文案就是 `resource.error`，重试调用 `resource.load()`。`not_computed` 与 `degraded` 由页面按业务数据自己传给 `DataBlock`。

## 7. 组件清单

通用层在 `web/src/lib/ui/<组件>/`（shadcn-svelte 复制来的，按令牌改写；Bits UI），领域层在 `web/src/lib/ui/domain/`。导入形如 `import { Button } from '$lib/ui/button/index'`、`import PageCard from '$lib/ui/domain/PageCard.svelte'`。

### 7.1 通用层

| 组件 | 路径与 API | 规则 |
| --- | --- | --- |
| `Button` | `ui/button/`：`variant`：`primary` / `outline`（默认）/ `ghost` / `link` / `destructive`；`size`：`sm`（28px，表格内）/ `md`（32px）/ `icon`（28px 方形）；`busy`、`busyText`；传 `href` 渲染成 `<a>` | 一个页头或一段至多一个 `primary`；导航用链接，动作用 `Button`；页面、视图和壳里没有裸 `<button>` |
| `Badge` | `ui/badge/`：只有中性底 | 带语气的徽标一律用 `StatusPill` |
| `Card` | `ui/card/`：`Root`、`Header`、`Title`、`Description`、`Content`、`Footer`、`Action` | 无阴影，`rounded-xl` + 1px `border-border`；页面上优先用 `PageCard` |
| `DataTable` / `Table` | `ui/data-table/`：`columns`（`key`、`header`、`align: 'left' \| 'num' \| 'center'`、`cell`、`value`、`title`、`cardLabel`、`hideInCards`）、`rows` 或 `groups`、`rowKey`、`ariaLabel`、`expandable` + `bind:expanded`、`muted(row)`、`cards: 'never' \| 'narrow'`、`pageSize`（默认 50，「显示更多」）、`sticky`、`headerGroups`、`caption` | 数字列 `align: 'num'` 右对齐等宽；状态列用 `StatusPill`；已结束的行置灰不删；放在 `PageCard` 里 |
| `ConfirmDialog` / `Dialog` | `ui/confirm-dialog/`：`bind:open`、`title`、`consequence`（一句话说清后果）、`actionLabel`（动作名，不写「确定」）、`destructive`、`busy`、`confirmDisabled`、`onConfirm`、`onCancel`、`children`（可选的表单体） | 不可逆动作必经；确认后不自动关，调用方做完事再关；初始焦点在取消 |
| `Sheet` | `ui/sheet/`：`Content` 的 `side`、`width: 'sm' \| 'lg'`（24rem / 40rem，窄屏全宽） | 侧边抽屉 |
| `TabNav` | `ui/tab-nav/`：`label`、`items: { href, label, current, badge?, badgeLabel? }[]` | 改地址的页签：链接 + `aria-current="page"`，不是 tablist |
| `Tabs` | `ui/tabs/`（Bits `Tabs`） | 只用于**不改地址**的页内页签 |
| `Field` | `ui/field/`：`label`、`id`、`hint`、`error`、`required`；`children` 收 `{ id, describedby, invalid }` | 标签在上，说明与错误在下，错误 `role="alert"` |
| `Input` / `Textarea` / `Select` / `Label` | `ui/input/`、`ui/textarea/`、`ui/select/`、`ui/label/` | 放在 `Field` 里；数字字段 `inputmode="decimal"` 右对齐 |
| `Tooltip` / `Popover` | `ui/tooltip/`、`ui/popover/`；`Tooltip.Provider` 在 `app.svelte` 全局提供 | 图标按钮的名字、表头缩写；就地展开的小浮层 |
| `Collapsible` | `ui/collapsible/` | 折叠段；`Content` 外面再包 `{#if open}` 时加 `forceMount` |
| `Alert` | `ui/alert/`：`variant`：`info`（`role="status"`）/ `warn` / `danger`（`role="alert"`）；`Title`、`Description`、`Action` | 表单内的失败原因、`DataBlock` 的降级与错误 |
| `Skeleton`、`Separator` | `ui/skeleton/`、`ui/separator/` | 骨架只由 `DataBlock` 用 |
| `Toaster` / `notify` | `ui/sonner/`（在 `app.svelte` 挂载）、`ui/toast.ts` | `notify.success` / `notify.info` 3 秒消失；`notify.error` 不自动消失，带关闭按钮 |
| `useNarrow()` | `ui/narrow.svelte.ts` | 是否窄于 768px；没有 `matchMedia` 时按桌面 |
| `fmtTime`、`fmtClock`、`fmtDuration`、`isHttpUrl` | `ui/format.ts` | 第 9 节 |
| `UNREACHABLE`、`UNAVAILABLE` | `ui/copy.ts` | 第 9 节 |

### 7.2 领域层

| 组件 | 路径与 API | 规则 |
| --- | --- | --- |
| `Page` | `domain/Page.svelte`：`width?: 'default' \| 'full'`；其余属性（`data-*`、`aria-*`）落在根元素上 | 页面的根（第 4 节） |
| `PageHeader` | `domain/PageHeader.svelte`：`title`、`level?`（1–3，默认 2）、`meta?`、`actions?` | 标题 + 一行次要文字 + 右侧动作区；页面标题用 level 1 |
| `Section` | `domain/Section.svelte`：`title?`、`level?`（2–4）、`description?`、`actions?`、`children` | 有标题时是以标题命名的 region |
| `PageCard` | `domain/PageCard.svelte`：`title?`、`ariaLabel?`、`tag?`、`actions?`、`children` | 一类数据的容器；有 `title` 或 `ariaLabel` 时是以它命名的 region，都没有时是普通的框；标题旁的 `tag` 写条数之类的次要标记 |
| `DataBlock` | `domain/DataBlock.svelte`：`state`、`message?`、`skeleton?`、`onRetry?`、`retryLabel?`、`page?` | 五态的唯一实现（第 6 节） |
| `StatusPill` | `domain/StatusPill.svelte`：`domain`、`value`、`text?`、`title?` | 圆点 + 文字；DOM 带 `data-domain` / `data-status` / `data-tone` |
| `Icon` | `domain/Icon.svelte`：`name`、`size?`（16 / 20）、`label?` | 图标只用 `@lucide/svelte`，经 `Icon`；没有 `label` 时是装饰性的。底座图标在 `domain/icons.ts`，项目的在 `lib/app/icons.ts`：加图标就是在那里加一行 import 和一行映射 |
| `ExternalLink` | `domain/ExternalLink.svelte`：`href`、`children` | 数据里来的地址唯一的写法：只有 http / https 成为链接（新窗口、`noopener noreferrer`），其余显示成文字 |
| `ResourceBlock` | `lib/views/ResourceBlock.svelte`：`resource`、`emptyMessage`、`children` | 第 6 节 |

底座图标：`check`、`chevron-down`、`chevron-right`、`circle-x`、`external-link`、`info`、`menu`、`moon`、`panel-left`、`plus`、`refresh-cw`、`settings`、`sun`、`triangle-alert`、`x`。

## 8. 交互

- **不可逆动作必须经 `ConfirmDialog`**，`consequence` 一句话说清后果。不用原生 `confirm` / `alert` / `prompt`；结果提示用 `notify`。
- **提交**：提交中按钮 `busy` 并加重入保护；失败保留草稿并在表单内用 `Alert` 显示原因；成功后 `notify.success` 并让相关资源失效。
- **链接**：站内导航用 `href="#…"` 或项目的 `hrefOf(…)`；数据里来的外部地址用 `ExternalLink`。
- **键盘**：`focus-visible` 显示 `--ring`；`Esc` 关最上层浮层；对话框与 `Sheet` 关闭后焦点还给触发元素。
- **表单**：标签在上、错误在字段下并带 `aria-describedby`。
- **表格**：数字列右对齐等宽；状态列用 `StatusPill`；超过 50 行「显示更多」；已结束行置灰不删。
- **横向滚动的容器要锁住纵向**：`overflow-x-auto` 同一行必须有同样前缀的 `overflow-y-hidden`；不用 `overflow-auto`、`overflow-scroll`（系统设成始终显示滚动条时，内容只多出 1 像素也会冒出竖向滚动条）。
- **浏览器存储**：只有深浅色（`lib/theme.ts`）和壳的布局（`lib/shell/layout.svelte.ts`）可以用，项目另有需要的在守护入口里登记（第 12 节）。

## 9. 文案与格式

- 界面文字简体中文；全角标点，「」作引号，中西文与数字之间半角空格，单位紧跟数字（`12 条`、`3 分 05 秒`）。
- **时间显示到分钟**：`2026-11-14 08:03`（`fmtTime`），时钟 `08:03`（`fmtClock`）；完整时间放在 `<time>` 的 `title` 里。不换算成浏览器时区：要么原样显示接口给的时间，要么传 `timeZone` 换算到指定时区。
- **时区**：一个页面只有一种时区时，在页头 `meta` 写一次（「时间为北京」），值不带后缀；一个页面有多种时区时，每个值带后缀（`fmtTime(iso, { timeZone, suffix: '北京' })`）。
- **耗时**用 `fmtDuration`：「42 秒」「3 分 05 秒」；没有记录写「无记录」。
- 缺值不写 `—` 或留空：没有数据写原因（第 6 节）。
- **错误原因**：接口给了中文说明就原样显示；连不上服务是 `UNREACHABLE`（「连不上本机服务，请确认页面服务在运行」）；其余是 `UNAVAILABLE`（「服务暂时不可用，请稍后重试」）。不显示英文码、堆栈和异常原文。
- 按钮写动作名（「批准」「停用」「保存」），确认按钮不写「确定」。
- 运行状态的用词见第 5 节；设置入口叫「设置」。

## 10. 品牌

- **字标**：左栏顶部，标记在左、项目英文名在右，`font-serif font-semibold`。
- **标记**：一个圆角方块里的白色线条图形，与 favicon 是同一个图形。favicon 是 64×64、圆角 12、底色 `#1a1a19`（`--primary` 的浅色值）、白色 5px 圆头线条。页面里的标记用令牌类（`fill-primary`、`stroke-primary-foreground`），所以深色下自动反色。
- 各项目的图形：Windrose 是八向风玫瑰；Bearing 是一个圆加一条从圆心指向右上的方位线；Meridian 是一个圆加一条贯穿的竖线。
- **名称**：`<title>` 就是项目名；`package.json` 的 `name` 是 `<项目名小写>-web`。
- 十六进制颜色只出现在 `index.html` 的 favicon 里（守护不扫 `index.html` 的颜色），组件里一律用令牌。

## 11. 项目扩展文件

同步文件通过固定路径引用这些文件；它们是项目与底座之间的全部接口。同步脚本只在它们不存在时按 `templates/` 生成，之后不碰。

| 路径 | 必须导出 | 放什么 |
| --- | --- | --- |
| `web/src/styles/project.css` | 无（可以为空） | 项目自己的令牌与 `@theme inline` 映射 |
| `web/src/lib/app/status.ts` | `TONES`（`as const satisfies Record<string, Record<string, Tone>>`）、`LABELS`、`labelText(text)` | 项目的状态词表（第 5 节） |
| `web/src/lib/app/icons.ts` | `ICONS`（名字到 lucide 组件的表，`as const`） | 项目的图标 |
| `web/src/lib/api.ts` | `get<T>(path): Promise<T>`、`errorText(cause): string` | 接口客户端；其余导出（`post`、错误类……）随项目 |
| `tests/test_frontend_design_guards.py` | pytest 测试 | 调用通用守护并传入本项目的范围；项目自己的规则也写在这里 |

## 12. 守护

`tests/meridian_guards.py`（同步文件）离线读项目的 `web/src`（`.svelte`、`.ts`，不含 `*.test.ts`、`*-fixtures.ts`）。零基线、零容忍，没有按文件的豁免。项目的 `tests/test_frontend_design_guards.py` 用 `Guards(ROOT, …)` 传入范围，每条检查对应一个测试。

| 禁止 | 检查 |
| --- | --- |
| 原色类名（`text-red-600`）、`text/bg/border-white|black` | `check_raw_palette` |
| 十六进制或 `rgb()` / `hsl()` / `oklch()` 字面量 | `check_hex_rgb` |
| emoji | `check_emoji` |
| 组件 `<style>` 块 | `check_style_blocks` |
| 裸 `<button>`（`button_scopes` 里；只有 `lib/ui/**` 可写） | `check_native_buttons` |
| 原生 `confirm` / `alert` / `prompt` | `check_native_dialogs` |
| `{@html}`、`innerHTML`、`outerHTML`、`insertAdjacentHTML`、`document.write` | `check_raw_html` |
| `style=` 属性（`style_attr_scopes` 里） | `check_style_attrs` |
| `lib/theme.ts`、`lib/shell/layout.svelte.ts` 与项目登记的 `storage_files` 之外的浏览器存储 | `check_storage` |
| 没锁住纵向的横向滚动容器；`overflow-auto`、`overflow-scroll` | `check_horizontal_scrollers` |
| 页面（`page_files`）的根不是 `<Page>` | `check_page_roots` |
| 页面里 `PageHeader level={1}` 不是恰好一个；`lib/shell/TopBar.svelte` 之外的裸 `<h1>` | `check_single_h1` |
| `--secondary*`、`--accent*`、`--sidebar*` 令牌；非十六进制颜色令牌 | `web/src/styles/tokens.test.ts` |
| `text-2xl` 以上字号、自写间距值、卡片 / 按钮 / 输入框加阴影、用空白 / `—` / `null` 表达数据状态 | 审查（没有静态守护） |

守护是正则检查，仍能绕过的写法靠审查：`confirm(变量)`、CSS 命名色（`text-[red]`）、`<svelte:element this="button">`。`self_check()` 给每条正则都配了「会拦」和「不误拦」的例子；`check_not_vacuous` 保证扫到了足够多的文件和至少一个页面。

同步文件在项目里不能改，由 `web/meridian.lock.test.js` 守着：它随 `npm test` 运行，逐个比对 `web/meridian.lock.json` 里记的 sha256。

## 13. 怎么改标准

在 Meridian 里改，画廊里看效果，跑测试，更新本文与 `CHANGELOG.md`，改 `VERSION`，提交；然后对每个项目运行 `python3 scripts/sync.py <项目根目录>` 并在那边提交。不要在项目里直接改同步文件。

- **改令牌**：改 `tokens.css` 两套、`tokens.test.ts` 的检查、本文第 2 节的取值表。
- **加通用组件**：先查第 7 节，没有再加；补 `*.test.ts`（只用底座的 `block` 域和底座图标，或者 `vi.mock` 掉项目扩展文件，这样测试在每个项目里说的是同一件事）、画廊里的示例、本文第 7 节一行。目录在 `meridian.manifest.json` 的 `synced` 覆盖范围内才会被同步。
- **加底座图标**：`lib/ui/domain/icons.ts` 加一行 import 和一行映射，同步 `Icon.test.ts` 的名字表和第 7.2 节的清单。
- **改壳**：改 `lib/shell/`，同步第 3 节；两种配置（带抽屉、不带抽屉）都要在画廊和测试里过一遍。
- **改守护**：改 `tests/meridian_guards.py` 与 `self_check()` 的例子、`tests/test_meridian_guards.py`、第 12 节的表；新检查要加进 `templates/tests/test_frontend_design_guards.py`，已有项目的入口文件由项目自己补一行。
- **升级依赖**：`web/package.json` 与 `meridian.manifest.json` 的 `dependencies` 一起改；各项目先改自己的 `package.json` 再同步。
- **项目里的事**（加状态值、加业务图标、加页面、加领域组件）：在项目里做，不经过 Meridian。
