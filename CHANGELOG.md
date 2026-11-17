# 变更记录

版本号写在 `VERSION`。消费项目的 `web/meridian.lock.json` 记着它同步的是哪一版。

## 0.1.0（2026-11-14）

首版，见 [设计](docs/specs/2026-11-14-meridian-v1-design.md)。

- 令牌、通用组件、通用领域组件：取自 Windrose 与 Bearing 逐字相同的部分，加 Bearing 的 `popover`、`select`、`sheet`、`tabs`、`tooltip`。
- 状态词表与图标表拆成「底座 + 项目扩展文件」（`lib/app/status.ts`、`lib/app/icons.ts`）。
- 取数层：合并 Windrose 的「重新加载不闪骨架屏」「`failure`」与 Bearing 的 `reset()`，新增 `emptyWhen`；只依赖 `$lib/api` 的 `get` 与 `errorText`。
- 新增应用壳 `AppShell`（左栏、顶栏、可选抽屉）、页面容器 `Page`、`PageCard`（标题可选）、`lib/ui/format.ts`、`lib/ui/copy.ts`。
- 新增同步脚本 `scripts/sync.py`、锁文件测试、通用守护 `tests/meridian_guards.py`、画廊。
- 通用守护比两个项目原有的多三条：横向滚动容器要锁住纵向（取自 Windrose v1.2，`TabNav`、`table`、`DataTable` 同步取了它的修复）、页面的根是 `<Page>`、每页恰好一个 `h1`。
