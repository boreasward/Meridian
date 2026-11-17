# Meridian v1 设计：溯风中后台前端底座

日期：2026-11-14 · 状态：待确认（第 16 节有 5 项取舍等你点头）

Meridian 是溯风工作室中后台页面的共同底座：令牌、通用组件、应用壳、页面骨架、取数层、设计守护和设计规范只在这里维护一份，Windrose 和 Bearing（仓库目录 `investment-assistant`）从这里同步。名字取自子午线：所有方位都以它为基准。

## 1. 背景与问题

两个项目的前端是同一套技术栈（Svelte 5 + Tailwind v4 + shadcn-svelte / Bits UI，依赖版本一致）。Windrose 的前端是 2026-11-13 从 Bearing 复制出来的，此后两份各自修改，没有共同的源头。2026-11-14 逐文件对比的结果：

**现在一致的**

- `tokens.css`：Windrose 是 Bearing 的子集，只删了涨跌色、图表色、对话字号，其余取值相同。
- `lib/ui/` 下两边都有的通用组件逐字相同。

**现在不一致的**

| 层面 | Bearing | Windrose |
| --- | --- | --- |
| 应用壳 | 左栏 + 顶栏 + 右抽屉，满屏 | 顶部页签 + 居中单栏 `max-w-5xl` |
| 内容底色 | 内容区 `bg-card` | 内容区 `bg-background`，顶栏 `bg-card` |
| 导航 | 图标 + 文字，当前项 `bg-muted` | 文字页签，当前项下划线 |
| 页面标题 | 顶栏一个 `h1`，`PageHeader` 又一个 `h1` | 只有 `PageHeader` |
| 品牌 | 无字标；`<title>` 是「Hermes Investment Assistant」；图标底色 `#0f766e`（令牌外） | 衬线字标；图标底色 `#1a1a19` |
| 深浅色切换 | 正式页面没有入口 | 顶栏有按钮 |
| 设置 | 顶栏齿轮打开 `Sheet` | 主导航里的「配置」页 |
| 页面间距 | `gap-4 p-4` 或 `gap-5` | `gap-6` 或 `gap-8` |
| 数据容器 | 每类数据一张 `PageCard` | 表格直接放在页面上（吸顶表头是 `bg-card`，页面是 `bg-background`，两种底色叠在一起） |
| 时间 | `2026-11-14 08:03:11 北京` | `2026-11-14 08:03`，时区写在页头 |
| 耗时 | `185.20 秒` | `3 分 05 秒` |
| 运行状态词 | 成功 / 部分成功 / 失败 | 完成 / 部分失败 / 出错 |
| 连不上服务 | 「网络连接失败，请稍后重试」 | 「连不上本机服务，请确认页面服务在运行」 |

**已经开始分叉的共用代码**

- `stores/resource.svelte.ts`：Windrose 加了「重新加载不闪骨架屏」和 `failure`；Bearing 加了 `reset()`。
- 设计守护测试：Windrose 比 Bearing 多 11 条检查。
- 组件画廊只有 Bearing 有。
- 两份 `docs/design-system.md`（373 行、244 行）各自写着「唯一设计规则」。

结论：颜色、字号、圆角、基础组件没有问题，不统一出在壳、页面骨架、品牌、文案格式这四层；根本原因是复制后没有同步机制。

## 2. 目标与不做的事

**目标**

1. 共用的前端代码和设计规范只有一个源头，两个项目里的副本改不动（改了测试就失败）。
2. 两个项目用同一个应用壳、同一套页面骨架、同一组品牌规则，并排打开时看得出是同一家的产品。
3. 同一含义在两个项目里同一个写法：时间、耗时、运行状态词、错误提示。
4. 之后新增的第三个中后台项目，同步一次就得到壳和全部组件。

**不做**

- 不改视觉风格：令牌取值、字体、圆角、阴影一个不动。
- 不发布 npm 包，不依赖远端仓库。
- 不改后端：接口字段、状态键、错误体格式都不动，差异在前端的项目扩展文件里消化。
- 不重命名 Bearing 的仓库目录和 Python 包（`investment_assistant`）。
- 不新增移动端布局；窄屏沿用 Bearing 现有做法（小于 1024px 时左栏与抽屉进 `Sheet`）。
- 图表库的统一不在本版。

## 3. 决定一览

| 决定 | 取值 | 理由 |
| --- | --- | --- |
| 分发方式 | 源头仓库 + 同步脚本 + 锁文件测试 | 保留 shadcn「代码在自己仓库里」的模式；现有构建、别名、守护测试不用改；不需要推送 |
| 壳的基准 | 左侧导航（Bearing 式） | 中后台常见；Bearing 的 7 个视图加对话列表放不进顶部页签 |
| 副本路径 | 沿用现有路径（`lib/ui/**`、`lib/theme.ts`……） | 两个项目的 import 基本不用改 |
| 项目差异 | 放进固定的项目扩展文件（第 7 节），同步文件里不出现项目名 | 同步文件必须逐字相同才能上锁 |
| 页面 `h1` | 在 `PageHeader` 里；顶栏只在页面没有 `PageHeader` 时显示标题 | 每页恰好一个 `h1` |
| 底色 | 壳与内容区都是 `bg-background`，卡片、表格容器、浮层是 `bg-card` | 卡片边界靠底色加边框表达；表格吸顶表头本来就是 `bg-card` |
| 表格容器 | 表格一律放在 `PageCard` 里 | 同上 |
| 设置入口 | 左栏底部的「设置」 | 两个项目同一个位置；点开是页面还是 `Sheet` 由项目定 |
| 深浅色切换 | 顶栏最右，壳自带 | 两个项目同一个位置 |
| 运行状态词 | 完成 / 部分失败 / 失败 / 运行中 | 见第 11 节 |
| 画廊 | 只在 Meridian，是它自己的开发页面 | 通用组件只在一个地方看效果 |
| 接入顺序 | 先 Windrose，后 Bearing | Windrose 小（6 个页面），先用它验证同步机制和壳的通用性 |

## 4. 仓库结构

Meridian 自己就是一个最小的消费项目：目录结构与两个项目的 `web/` 相同，同步就是按相同的相对路径复制。

```
Meridian/
  README.md  CLAUDE.md  VERSION  CHANGELOG.md
  meridian.manifest.json        同步清单：同步文件、项目扩展文件的模板、共用依赖的版本
  scripts/sync.py               同步与检查（Python 标准库，无依赖）
  docs/
    design-system.md            底座的设计规范（唯一一份）
    specs/  plans/              约定同两个项目：写成后只增不改
  tests/
    meridian_guards.py          守护的共用部分（同步文件）
    test_frontend_design_guards.py   Meridian 自己的守护入口
    test_sync.py                同步脚本的测试
  web/
    package.json  vite.config.ts  ……
    src/
      styles/tokens.css  app.css  project.css
      lib/ui/**                 通用层与通用领域层
      lib/shell/**              应用壳
      lib/stores/resource.svelte.ts
      lib/views/ResourceBlock.svelte
      lib/theme.ts  utils.ts
      lib/app/**                Meridian 画廊自己的扩展文件，同时是模板
      lib/api.ts                画廊用的假接口，同时是接口约定的示例
      routes/Gallery.svelte     组件画廊
      meridian.lock.test.ts     锁文件测试（同步文件）
```

## 5. 分发：同步与锁

### 5.1 三类文件

| 类别 | 归谁 | 规则 |
| --- | --- | --- |
| 同步文件 | Meridian | 消费项目里的副本与 Meridian 逐字相同；在项目里改动会让锁文件测试失败 |
| 项目扩展文件 | 项目 | 路径和导出的形状由 Meridian 规定（第 7 节），内容归项目；第一次同步时若不存在就按模板生成，之后同步不碰 |
| 项目自有文件 | 项目 | 路由、视图、项目领域组件、路由表、接口客户端等，Meridian 不知道它们 |

### 5.2 同步命令

在 Meridian 仓库里运行：

```bash
python scripts/sync.py <消费项目根目录>            # 复制同步文件，生成缺失的扩展文件，写锁文件
python scripts/sync.py <消费项目根目录> --check    # 只比较，不写；有差异时退出码 1 并列出文件
```

同步做四件事：

1. 把清单里的同步文件按相同相对路径复制到消费项目。
2. 上一份锁文件里有、新清单里没有的文件，从消费项目删除。
3. 清单里的项目扩展文件若不存在，按模板生成。
4. 写 `web/meridian.lock.json`：Meridian 的版本号、提交号，以及每个同步文件的 sha256。

Meridian 工作区有未提交改动时拒绝同步（否则锁文件里的提交号对不上内容），`--allow-dirty` 可在开发时绕过，此时锁文件标 `dirty: true`。

### 5.3 锁文件测试

`web/src/meridian.lock.test.ts` 是同步文件，随 `npm test` 运行，离线，不需要 Meridian 在本机：

- 锁文件里每个文件都存在，sha256 与记录一致。失败信息写明「这是 Meridian 的同步文件，改动请在 Meridian 里做，然后重新同步」。
- 锁文件不得是 `dirty: true`（开发中间态不许提交）。

「项目落后于 Meridian 多少」不由测试管（测试不能依赖另一个仓库），由 `--check` 回答。

### 5.4 共用依赖的版本

清单里记共用依赖的确切版本（`svelte`、`tailwindcss`、`@tailwindcss/vite`、`bits-ui`、`tailwind-variants`、`@lucide/svelte`、`svelte-sonner`、`@fontsource/inter`、`@internationalized/date`）。同步时与消费项目的 `package.json` 比较，不一致就失败并列出差异，不自动改。

### 5.5 改底座的流程

1. 在 Meridian 里改，画廊里看效果，跑 Meridian 的测试。
2. 更新 `docs/design-system.md` 与 `CHANGELOG.md`，改 `VERSION`，提交。
3. 对每个消费项目运行同步，跑该项目的前端测试，提交（提交说明写 Meridian 的版本号）。

## 6. 底座内容

「来源」是首版代码取自哪一边。

| 路径（相对仓库根） | 来源 | 说明 |
| --- | --- | --- |
| `web/src/styles/tokens.css` | 两边相同的部分 | 表面、文字、强调、状态、阴影、圆角；不含涨跌色与图表色 |
| `web/src/styles/app.css` | Windrose | 令牌到 Tailwind 的映射、字号、圆角、动效、基础样式；顶部多一行 `@import './project.css'` |
| `web/src/styles/tokens.test.ts` | Windrose | 只断言底座令牌；项目令牌的断言归项目 |
| `web/src/lib/utils.ts`、`lib/theme.ts` | 相同 | |
| `web/src/lib/ui/{alert,badge,button,card,collapsible,confirm-dialog,data-table,dialog,field,input,label,separator,skeleton,sonner,tab-nav,table,textarea}/` | 相同 | |
| `web/src/lib/ui/{popover,select,sheet,tabs,tooltip}/` | Bearing | Windrose 接入后也会有；壳的窄屏布局要用 `sheet` 和 `tooltip` |
| `web/src/lib/ui/toast.ts`、`ui/narrow.svelte.ts` | 相同 | |
| `web/src/lib/ui/format.ts` | 新写 | `fmtTime`、`fmtClock`、`fmtDuration`（第 11 节） |
| `web/src/lib/ui/domain/DataBlock.svelte`、`PageHeader.svelte`、`Section.svelte` | 相同 | |
| `web/src/lib/ui/domain/ExternalLink.svelte` | Windrose | |
| `web/src/lib/ui/domain/StatusPill.svelte`、`status.ts` | 改写 | 只留机制（语气、`statusOf`、未知键的处理）和底座域 `block`；词表来自项目扩展文件 |
| `web/src/lib/ui/domain/Icon.svelte`、`icons.ts` | 改写 | 只留壳和通用组件用到的图标；其余来自项目扩展文件 |
| `web/src/lib/ui/domain/Page.svelte` | 新写 | 页面容器（第 9 节） |
| `web/src/lib/ui/domain/PageCard.svelte` | Bearing 的 `views/PageCard.svelte` | `title` 改为可选（没有标题时必须给 `ariaLabel`） |
| `web/src/lib/shell/AppShell.svelte`、`NavRail.svelte`、`NavList.svelte`、`TopBar.svelte`、`Drawer.svelte`、`layout.svelte.ts` | Bearing 的壳，去掉业务 | 第 8 节 |
| `web/src/lib/stores/resource.svelte.ts` | 合并 | Windrose 的「重新加载不闪骨架屏」与 `failure`，加上 Bearing 的 `reset()` |
| `web/src/lib/views/ResourceBlock.svelte` | Windrose | |
| 以上各组件旁的 `*.test.ts` | 各自来源 | 同步的测试只用底座域 `block` 和底座图标，不依赖项目词表 |
| `web/src/meridian.lock.test.ts` | 新写 | 5.3 |
| `tests/meridian_guards.py` | Windrose 的守护 | 正则与计数函数、通用检查；项目的范围与白名单由项目的测试文件传入 |
| `docs/design-system.md` | 两份合并 | 只留在 Meridian；项目文档改为「以 Meridian 为准，这里只写本项目多出来的」 |

## 7. 项目扩展文件

同步文件通过固定路径引用这些文件；它们是项目与底座之间的全部接口。

| 路径 | 必须导出 | Bearing 放什么 | Windrose 放什么 |
| --- | --- | --- | --- |
| `web/src/styles/project.css` | 无（可以是空文件） | 涨跌色、图表色、`[data-up='red']`、它们的 `@theme inline` 映射、`--text-chat` | 空 |
| `web/src/lib/app/status.ts` | `TONES`、`LABELS`（每个域一行）；可选 `labelText(text)` | 现有 30 多个域；`labelText` 是 `withStopTerm` | 现有 10 个域 |
| `web/src/lib/app/icons.ts` | `ICONS`（名字到 lucide 组件的表） | 业务图标 | 业务图标 |
| `web/src/lib/api.ts` | `get<T>(path)`、`errorText(cause): string` | 现有客户端（`X-Market`、`code: 说明` 的解析） | 现有客户端；`errorText` 就是现在的映射 |
| `tests/test_frontend_design_guards.py` | 调用 `meridian_guards` 的通用检查并传入本项目的范围 | 加自己的检查 | 加自己的检查（写接口白名单、外链、统计脚本等） |

约定：

- 底座的 `status.ts` 把底座域与项目词表合成一张表，`StatusDomain` 由合成后的表推出；「每个域一行、不用展开运算符」的形状检查对项目词表继续有效。
- `createResource(path, opts?)` 用 `$lib/api` 的 `get` 取数，用 `errorText` 把失败变成中文；`opts.emptyWhen(cause)` 让项目把某些失败当作「无数据」（Bearing 的 `no_run`）。
- 底座提供连不上服务时的统一文案常量 `UNREACHABLE`，两个项目的 `errorText` 都用它。

## 8. 应用壳

一个壳，两种配置。Bearing 用全部插槽；Windrose 不传抽屉和 `railBody`。

```
+----------+----------------------------------------------------+
| 标记 字标 | [标题] 上下文          状态 | 面板开关 | 深浅色切换 |
+----------+-------------------------------------+--------------+
| 导航项    |                                     |              |
| 导航项    |               内容区                |  抽屉（可选） |
| ……       |                                     |              |
+----------+                                     |              |
| 设置      |                                     |              |
+----------+-------------------------------------+--------------+
```

**尺寸**（沿用 Bearing）：左栏展开 208px / 折叠 56px；抽屉 288px；顶栏高 48px；小于 1024px 时左栏与抽屉共用一个 `Sheet`，同时只开一个，关闭后焦点回到触发按钮。

**`AppShell` 的 props**

| prop | 类型 | 说明 |
| --- | --- | --- |
| `brand` | `{ name: string; mark: Snippet }` | 左栏顶部：标记 + 衬线字标；折叠时只剩标记 |
| `nav` | `NavItem[]` | 主导航。`NavItem = { label, icon, href?, onclick?, current?, badge?, badgeLabel? }` |
| `footerNav` | `NavItem[]`（可选） | 左栏底部；「设置」放这里 |
| `railBody` | `Snippet<[{ collapsed, close }]>`（可选） | 替换主导航区域。Bearing 用它放「快捷入口 / 对话」分段，其中快捷入口仍用底座的 `NavList` |
| `title` | `string`（可选） | 顶栏里的 `h1`。**只在页面没有 `PageHeader` 时传**（Bearing 的对话页） |
| `context` | `Snippet`（可选） | 顶栏左侧的次要信息。Bearing：数据时点 + 市场开关 |
| `status` | `Snippet`（可选） | 顶栏右侧的项目状态。Windrose：「每日任务运行中」徽标 |
| `panes` + `drawer` | `{ id, label, icon }[]` + `Snippet<[id]>`（可选） | 右侧抽屉的面板；不传就没有抽屉，也没有面板开关 |
| `banner` | `Snippet`（可选） | 内容区上方的全局提示。Windrose：连不上服务的警告 |
| `children` | `Snippet` | 内容区 |

另导出 `dismissOverlay()`（窄屏下等 `Sheet` 关完再交出焦点，即 Bearing 现在的 `dismissForChat()`）。

**固定行为**

- 导航项一律是图标 + 文字，当前项 `bg-muted` 加粗并带 `aria-current="page"`；折叠时只显示图标，角标变成圆点，文字进 `title`。
- 顶栏右侧的顺序固定：项目状态、面板开关、分隔线、深浅色切换。深浅色切换由壳自带，项目不用传。
- 左栏折叠状态与抽屉状态记在本机（键名沿用 `ws.nav.collapsed`、`ws.drawer`，Bearing 用户现有的偏好不丢）；存储不可用时仍能用。
- 壳不取业务数据，不认识任何路由。

**Windrose 的导航**：概览、每日内容、信息源（带待审核数角标）、主题、运行记录五项在主导航，「设置」（原「配置」）在左栏底部。

## 9. 页面骨架

| 规则 | 写法 |
| --- | --- |
| 页面容器 | 每个页面的根是 `<Page>`：`mx-auto grid w-full max-w-6xl gap-6 p-4 lg:p-6`。需要满宽的页面（Bearing 的今日两栏、对话）传 `width="full"`。页面自己不写外边距和最大宽度 |
| 标题 | 每页恰好一个 `h1`，来自 `PageHeader level={1}`；次要信息（日期、时区、口径）在它的 `meta`；右侧至多一个主按钮 |
| 分段 | `Section`，不嵌套超过两层；页面里段与段之间是 `Page` 的 `gap-6` |
| 数据容器 | 一类数据（一张表、一组指标、一个表单）一张 `PageCard`。表格一律在 `PageCard` 里。不把列表的每一行做成一张卡 |
| 间距 | 组件内 `1 / 2 / 3`，卡片内 `3`，块间 `4`，页内分段 `6`。不用 `gap-5`，`gap-8` 只用在一页里两个无关区域之间 |
| 底色 | 左栏、顶栏、抽屉、内容区都是 `bg-background`，彼此用 1px `border-border` 分隔；`PageCard`、浮层是 `bg-card`。没有卡片的阅读区（Bearing 的对话）可以整块 `bg-card` |
| 取数 | 取数的块用 `ResourceBlock`，五态由 `DataBlock` 表达，规则不变 |

## 10. 品牌

- **字标**：左栏顶部，标记在左、项目英文名在右，`font-serif font-semibold`。
- **标记与图标同族**：64×64、圆角 12 的方块，底色 `#1a1a19`（即 `--primary` 的浅色值），白色 5px 圆头线条的图形。左栏里的标记与 favicon 是同一个图形。
  - Windrose：现有的八向风玫瑰。
  - Bearing：一个圆加一条从圆心指向右上的方位线（替换现在的青绿色折线图标）。
  - Meridian：一个圆加一条贯穿的竖线。
- **名称**：`<title>` 就是项目名（`Windrose`、`Bearing`）；`package.json` 的 `name` 是 `windrose-web`、`bearing-web`、`meridian-web`。
- 图标里的十六进制颜色只出现在 `index.html` 和标记的 SVG 里，是守护的既有例外，不扩大。

## 11. 文案与格式

| 项 | 规则 |
| --- | --- |
| 时间 | 显示到分钟：`2026-11-14 08:03`；完整时间放在 `<time>` 的 `title` 里 |
| 时区 | 一个页面只有一种时区时，在页头 `meta` 写一次（「时间为北京」），值不带后缀；一个页面有多种时区时（Bearing 的成交是市场时区、页面时间是北京），每个值带时区后缀 |
| 耗时 | `fmtDuration`：「42 秒」「3 分 05 秒」；没记录写「无记录」 |
| 运行状态词 | 同一含义同一个词：成功结束是「完成」，部分失败是「部分失败」，失败是「失败」，进行中是「运行中」，被打断是「已中断」。键名各项目照自己的接口，不统一 |
| 连不上服务 | 「连不上本机服务，请确认页面服务在运行」 |
| 其余失败 | 接口给了中文说明就原样显示；没有就是「服务暂时不可用，请稍后重试」 |
| 设置入口的名字 | 「设置」 |

对两个项目的具体改动：Bearing 的「成功」改「完成」、「部分成功」改「部分失败」，时间去掉秒；Windrose 的「出错」改「失败」，「配置」改「设置」。

## 12. 守护与画廊

- **守护**：`tests/meridian_guards.py` 是 Windrose 现有守护的通用部分（原色类名、十六进制与 `rgb()`、emoji、`<style>`、裸 `<button>`、原生对话框、`{@html}`、内联 `style`）。项目的 `tests/test_frontend_design_guards.py` 传入自己的扫描范围，并保留自己的规则。Bearing 因此补上它现在没有的几条通用检查。
- **新增两条通用检查**：页面根元素是 `<Page>`；每个页面源文件里 `level={1}` 的 `PageHeader` 恰好一个。
- **浏览器存储**：通用规则是「只有 `lib/theme.ts` 和 `lib/shell/layout.svelte.ts` 可以碰本机存储」，项目可以追加自己的白名单（Bearing 的 `markets.svelte.ts`）。
- **画廊**：Meridian 的开发页面就是画廊，从 Bearing 的 `UiGallery.svelte` 取通用部分，加上壳的两种配置（带抽屉、不带抽屉）和页面骨架的示例，浅深色可切换。Bearing 的 `#_ui` 只保留 Bearing 自己的领域组件。

## 13. 迁移顺序

每个阶段各有实施 plan；两个项目的接入按各自仓库的约定，在各自的 `docs/specs/`、`docs/plans/` 里另写文件（Windrose v1.1 的 spec 写了「没有侧栏」，按只增不改的约定由新 spec 说明被取代）。

| 阶段 | 仓库 | 内容 | 完成的标志 |
| --- | --- | --- | --- |
| P0 | Meridian | 搭仓库：底座内容（第 6 节）、扩展文件模板、同步脚本、锁文件测试、画廊、合并后的设计规范 | Meridian 的前端测试与构建通过；对一个空的临时目录同步后 `--check` 无差异 |
| P1 | Windrose | 同步；换壳；六个页面改用 `Page` 与 `PageCard`；「配置」移到左栏底部并改名；文案按第 11 节 | 第 14 节的验收项在 Windrose 上全部通过 |
| P2 | Bearing | 同步；涨跌色等移到 `project.css`；词表移到 `lib/app/status.ts`；`Shell` 换成 `AppShell`；去掉重复的 `h1`；品牌；文案与时间格式 | 第 14 节的验收项在 Bearing 上全部通过 |
| P3 | 三个仓库 | 两个项目的 `design-system.md` 删去与底座重复的章节；并排验收 | 第 14 节第 6 项 |

P1 中若发现壳或页面骨架不够用，回到 Meridian 改，再同步，不在项目里打补丁。

## 14. 验收

1. 两个项目的 `npm test` 里锁文件测试通过；`sync.py --check` 对两个项目都无差异。
2. 两个项目各自的前端全量（`npm test && npm run build`）与守护测试通过。
3. 两个项目里不再有 `lib/ui/`、`lib/shell/` 下不在锁文件里的通用组件副本（项目领域组件除外）。
4. 每个页面恰好一个 `h1`；每个页面的根是 `<Page>`（守护检查）。
5. 文案：两个项目里搜不到「网络连接失败」；运行成功都显示「完成」；耗时都是「N 分 NN 秒」的写法。
6. 并排目视（1440×900，浅色与深色各一次）：左栏宽度、标记与字标的位置、顶栏高度、深浅色按钮的位置、「设置」的位置、页面标题的字号与位置、卡片与页面的底色关系，两个项目一致。

## 15. 风险与待验证

| 风险 | 在哪一步验证 | 若不成立 |
| --- | --- | --- |
| Tailwind v4 里，被 `@import` 的 `project.css` 中的 `@theme inline` 块能否正常生成工具类 | P0 第一件事 | 改为项目自己的 `app.css` 导入底座的两个文件，底座 `app.css` 拆成不含入口的 `theme.css` |
| 同步文件引用项目扩展文件（`$lib/app/status`）后，`StatusDomain` 的类型推导与 `svelte-check` 是否通过 | P0 | 词表改为启动时注册，类型退回 `string` 加运行时检查 |
| Bearing 有大量断言壳结构的测试（`Shell.test.ts` 等），换壳要重写 | P2 的 plan 里单列 | 无替代方案，是本次最大的工作量 |
| Windrose 的守护规定「浏览器存储只放主题」，壳要记左栏折叠状态 | P1，取决于第 16 节第 2 项 | Windrose 的壳不记折叠状态（每次打开都是展开） |
| 手工同步容易忘，项目长期落后于 Meridian | 5.5 的流程 | 之后可在两个项目的验收任务里加一步 `--check` |

## 16. 需要你确认的取舍

这五项都改变了项目现有的行为或既有约定，默认按「建议」做，你有不同意见就改这里。

1. **Bearing 的时间去掉秒**（`08:03:11 北京` 变 `08:03 北京`，完整时间放悬停提示）。建议：去掉。
2. **Windrose 记住左栏是否折叠**，需要把它「浏览器存储只放主题」的守护放宽到「主题与壳布局」。这不是对内容的反应，不违反「不记录用户」的产品规则。建议：放宽。
3. **Windrose 的「配置」改名「设置」并移到左栏底部。** 建议：改。
4. **Bearing 的页面名称改为 Bearing**（`<title>`、字标、图标、`package.json` 的 `name`）；仓库目录和 Python 包名不动。建议：改。
5. **运行状态词统一为「完成 / 部分失败 / 失败」**（Bearing 改两个词，Windrose 改一个词）。建议：统一。

## 17. 确认记录（2026-11-14 追加）

第 16 节的 5 项取舍全部按「建议」确认。实施中对本文的两处细化，记在这里，前文不改：

- 锁文件测试是 `web/meridian.lock.test.js`（不在 `src/` 下，也不是 `.ts`）：两个项目都没有装 `@types/node`，放在 `src/` 里的 `.ts` 过不了 `svelte-check`。
- 项目扩展文件的模板放在 Meridian 的 `templates/` 下，与 Meridian 画廊自己的 `lib/app/` 分开（画廊的词表是演示用的，不适合当新项目的起点）。语气类型 `Tone` 单独放在 `lib/ui/domain/tone.ts`，项目词表从这里引类型，避免与 `status.ts` 互相引用。
- `lib/app/status.ts` 的 `labelText` 是必须导出的（没有要改的就原样返回），不是可选的：可选导出要靠命名空间访问，打包器会为每个没有它的项目报一条警告。
- `AppShell` 多一个 `defaultPane`（用户没选过时宽屏默认打开的面板，缺省不打开）。窄屏的 `Sheet` 打开什么不记忆、也不改宽屏的偏好；Bearing 现在的做法是窄屏一进来就把记住的面板弹成 `Sheet`，换壳后不再这样。
- 左栏的折叠按钮在左栏最底部（`footerNav` 之下），不在品牌行：折叠到 56px 后品牌行只放得下标记。
- 接口客户端不统一（两个项目的错误体格式不同：一个是 `{"error": "<中文>"}`，一个是 `{"error": "<码>", "detail": "<中文>"}`）。底座只约定 `get` 与 `errorText` 两个导出，并提供 `UNREACHABLE`、`UNAVAILABLE` 两句统一文案；Bearing 的 `no_run` 之类用 `createResource` 的 `emptyWhen` 表达。
- Windrose 在 2026-11-14 晚的 v1.2 里修了横向滚动容器的竖向滚动条（`TabNav`、`table`、`DataTable`），并加了一条守护。这是通用规则，已并入底座：三个组件取 Windrose 的新版，守护成为 `check_horizontal_scrollers`。
