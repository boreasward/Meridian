# Meridian 项目约定

- **分支**：只在 `main` 主干开发，不另开分支；不 `git push`，除非用户要求。
- **设计与计划文档**：spec 放 `docs/specs/YYYY-MM-DD-<topic>-design.md`，plan 放 `docs/plans/YYYY-MM-DD-<topic>.md`；写成后只增不改（要改就追加新内容或新文件，不改写既有段落）。`docs/design-system.md` 是活的：组件、令牌、壳或交互规则变了，与代码同一个提交更新。
- **同步文件里不写项目名**：`meridian.manifest.json` 的 `synced` 里的文件会逐字复制到 Windrose、Bearing 等消费项目，不得出现项目名或某个项目的业务词；项目差异只经 `templates/` 里那几个扩展文件进入。
- **改了同步文件就要发版**：改 `VERSION`、写 `CHANGELOG.md`、提交，然后对每个消费项目运行 `python scripts/sync.py <项目根目录>` 并在那边提交。不要在消费项目里直接改同步文件（那边的锁文件测试会失败）。
- **依赖版本**：`web/package.json` 与 `meridian.manifest.json` 的 `dependencies` 保持一致，并与消费项目一致；升级依赖是一次发版。
- **测试分级**：每个 Task 只跑本 Task 的测试文件；`pytest tests -q` 与前端全量（`cd web && npm test && npm run build`）只在最后的验收 Task 各跑一次。
