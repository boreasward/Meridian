#!/bin/bash
# 验收：前端全量（装依赖、组件测试、类型检查与构建）加 Python 测试，输出同时写进 .local/verify.log。
# 在 Finder 里双击，或在终端里运行 scripts/verify.command。
cd "$(dirname "$0")/.." || exit 1
mkdir -p .local
LOG=.local/verify.log
: > "$LOG"
run() {
  echo "=== $* ===" | tee -a "$LOG"
  "$@" 2>&1 | tee -a "$LOG"
  local code=${PIPESTATUS[0]}
  echo "--- exit $code ---" | tee -a "$LOG"
  return "$code"
}
FAILED=0
(cd web && run npm install --no-fund --no-audit) || FAILED=1
(cd web && run npm test) || FAILED=1
(cd web && run npm run build) || FAILED=1
PYTEST=""
for candidate in .venv/bin/pytest ../company/Windrose/.venv/bin/pytest ../investment-assistant/.venv/bin/pytest; do
  [ -x "$candidate" ] && PYTEST="$candidate" && break
done
if [ -n "$PYTEST" ]; then
  run "$PYTEST" tests -q -p no:cacheprovider || FAILED=1
else
  run python3 -m pytest tests -q -p no:cacheprovider || FAILED=1
fi
echo "=== RESULT: $([ "$FAILED" = 0 ] && echo PASS || echo FAIL) ===" | tee -a "$LOG"
exit "$FAILED"
