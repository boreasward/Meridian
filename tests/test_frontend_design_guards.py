"""本项目 `web/src` 的设计守护入口：通用检查来自 Meridian 的同步文件 tests/meridian_guards.py，这里只定范围。

项目自己的规则（接口白名单、外链、统计脚本之类）也写在这个文件里。"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from meridian_guards import Guards, self_check  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]

GUARDS = Guards(
    ROOT,
    # where a raw <button> / an inline style= is banned (relative to web/src)
    button_scopes=('routes/', 'lib/views/', 'lib/shell/', 'lib/components/'),
    style_attr_scopes=('routes/', 'lib/views/', 'lib/shell/', 'lib/ui/domain/'),
    # the files that are pages: each starts with <Page> and has exactly one PageHeader level={1}
    page_files=('routes/*.svelte',),
    # files allowed to touch browser storage besides lib/theme.ts and lib/shell/layout.svelte.ts
    storage_files=(),
)


def test_no_raw_palette_classes():
    GUARDS.check_raw_palette()


def test_no_hex_or_rgb_literals():
    GUARDS.check_hex_rgb()


def test_no_emoji():
    GUARDS.check_emoji()


def test_no_style_blocks():
    GUARDS.check_style_blocks()


def test_no_native_buttons():
    GUARDS.check_native_buttons()


def test_no_native_dialogs():
    GUARDS.check_native_dialogs()


def test_no_raw_html():
    GUARDS.check_raw_html()


def test_no_inline_style_attributes():
    GUARDS.check_style_attrs()


def test_browser_storage_only_in_the_allowed_files():
    GUARDS.check_storage()


def test_horizontal_scrollers_never_scroll_vertically():
    GUARDS.check_horizontal_scrollers()


def test_every_page_starts_with_page():
    GUARDS.check_page_roots()


def test_every_page_has_exactly_one_h1():
    GUARDS.check_single_h1()


def test_guard_patterns_bite_and_ignore_false_positives():
    self_check()


def test_scan_is_not_vacuous():
    GUARDS.check_not_vacuous(known=('app.svelte', 'lib/ui/button/button.svelte', 'lib/ui/domain/StatusPill.svelte', 'lib/api.ts'))
