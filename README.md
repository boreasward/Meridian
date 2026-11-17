# Meridian

溯风工作室中后台页面的共同底座：令牌、通用组件、应用壳、页面骨架、取数层、设计守护和设计规范只在这里维护一份，Windrose、Bearing 等项目从这里同步。

名字取自子午线：所有方位都以它为基准。

## 这里有什么

| 位置 | 内容 |
| --- | --- |
| `web/src/styles/` | 令牌（`tokens.css`）与它们到 Tailwind 的映射（`app.css`） |
| `web/src/lib/ui/` | 通用组件（shadcn-svelte / Bits UI，按令牌改写）与通用领域组件（`domain/`） |
| `web/src/lib/shell/` | 应用壳 `AppShell`：左栏、顶栏、可选的右侧抽屉 |
| `web/src/lib/stores/resource.svelte.ts` | 共享取数资源 |
| `web/src/routes/` | 组件画廊，也是 Meridian 自己的开发页面 |
| `templates/` | 项目扩展文件的模板（项目令牌、状态词表、图标、接口客户端、守护入口） |
| `scripts/sync.py` | 把同步文件复制到消费项目并写锁文件 |
| `tests/meridian_guards.py` | 通用设计守护 |
| `docs/design-system.md` | 设计规范（唯一一份） |

## 看画廊

```bash
cd web && npm install && npm run dev
```

打开终端里显示的地址。画廊里有令牌、全部通用组件、状态与数据块五态、页面骨架，浅 / 深色可切换；它自己就跑在 `AppShell` 里。

## 同步到一个项目

```bash
python3 scripts/sync.py /path/to/project            # 复制同步文件，生成缺失的扩展文件，写 web/meridian.lock.json
python3 scripts/sync.py /path/to/project --check    # 只比较；有差异时退出码 1
```

- Meridian 有未提交的改动时拒绝同步；开发中可加 `--allow-dirty`，但那样写出的锁文件过不了项目里的锁文件测试。
- 项目的 `web/package.json` 里，共用依赖的版本必须与 `meridian.manifest.json` 一致，否则同步失败并列出差异。
- 同步文件在项目里是只读的：项目的 `npm test` 会跑 `web/meridian.lock.test.js`，任何一个文件被改动就失败。要改，就在这里改，然后重新同步。

项目自己的差异放在五个扩展文件里，同步只在它们不存在时按模板生成，之后不碰：

| 文件 | 放什么 |
| --- | --- |
| `web/src/styles/project.css` | 项目自己的令牌与 `@theme` 映射；可以为空 |
| `web/src/lib/app/status.ts` | 项目的状态词表 `TONES`、`LABELS` |
| `web/src/lib/app/icons.ts` | 项目的图标表 `ICONS` |
| `web/src/lib/api.ts` | 接口客户端，必须导出 `get(path)` 与 `errorText(cause)` |
| `tests/test_frontend_design_guards.py` | 守护入口：调用通用守护并传入本项目的范围 |

## 测试

```bash
python3 -m pytest tests -q                 # 同步脚本与设计守护
cd web && npm test && npm run build        # 组件测试、类型检查、构建
```

## 文档

- [docs/design-system.md](docs/design-system.md)：设计规范。
- [docs/specs/2026-11-14-meridian-v1-design.md](docs/specs/2026-11-14-meridian-v1-design.md)：v1 设计。
- [docs/plans/2026-11-14-meridian-v1-p0.md](docs/plans/2026-11-14-meridian-v1-p0.md)：搭底座的实施计划。
- [CHANGELOG.md](CHANGELOG.md)：各版变更。
- [CLAUDE.md](CLAUDE.md)：开发约定。
