"""tests/meridian_guards.py 的 `Guards`：在一个临时的小项目上，每条检查对违规都会失败，对合规的文件都通过。"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from meridian_guards import Guards  # noqa: E402

CLEAN_PAGE = '''<script lang="ts">
  import Page from '$lib/ui/domain/Page.svelte'
  import PageHeader from '$lib/ui/domain/PageHeader.svelte'
</script>

{#snippet meta()}<span>时间为北京</span>{/snippet}

<Page>
  <PageHeader title="概览" level={1} {meta} />
  <a href="#runs" class="text-muted-foreground">运行记录</a>
</Page>
'''


def _write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding='utf-8')


def project(tmp_path: Path, files: dict) -> Guards:
    src = tmp_path / 'web' / 'src'
    _write(src / 'routes/Overview.svelte', CLEAN_PAGE)
    _write(src / 'lib/theme.ts', "localStorage.getItem('theme')\n")
    _write(src / 'lib/shell/layout.svelte.ts', "localStorage.getItem('ws.nav.collapsed')\n")
    _write(src / 'lib/shell/TopBar.svelte', '<h1 class="font-serif">{title}</h1>\n')
    _write(src / 'lib/ui/button/button.svelte', '<button><slot /></button>\n')
    for rel, text in files.items():
        _write(src / rel, text)
    return Guards(tmp_path, storage_files=('lib/markets.svelte.ts',))


def fails(check) -> str:
    try:
        check()
    except AssertionError as error:
        return str(error)
    raise AssertionError('the check passed, it should have failed')


def test_a_clean_project_passes_every_check(tmp_path):
    guards = project(tmp_path, {'lib/markets.svelte.ts': "localStorage.setItem('ws.market', code)\n"})
    guards.check_all()
    guards.check_not_vacuous(known=('routes/Overview.svelte',), minimum=5)


def test_colour_checks_bite(tmp_path):
    guards = project(tmp_path, {
        'routes/A.svelte': CLEAN_PAGE.replace('text-muted-foreground', 'text-red-600'),
        'lib/views/B.svelte': '<p class="bg-white">x</p>\n',
        'lib/c.ts': "export const c = '#26a69a'\n",
    })
    message = fails(guards.check_raw_palette)
    assert 'routes/A.svelte: 1' in message and 'lib/views/B.svelte: 1' in message
    assert 'lib/c.ts: 1' in fails(guards.check_hex_rgb)


def test_markup_checks_bite_inside_their_scopes_only(tmp_path):
    guards = project(tmp_path, {
        'lib/views/A.svelte': '<button>x</button>\n<div style="width: 3px"></div>\n<style>.a{}</style>\n',
        'lib/ui/card/card.svelte': '<div style={vars}></div>\n',
        'lib/views/B.svelte': '<p>{@html body}</p>\n',
        'lib/c.ts': "if (confirm('sure?')) go()\nconst done = '\\u2705'\n",
        'lib/d.ts': "export const done = '✅'\n",
    })
    assert 'lib/views/A.svelte: 1' in fails(guards.check_native_buttons)
    assert 'lib/ui/button/button.svelte' not in fails(guards.check_native_buttons)
    style = fails(guards.check_style_attrs)
    assert 'lib/views/A.svelte: 1' in style and 'lib/ui/card/card.svelte' not in style
    assert 'lib/views/A.svelte: 1' in fails(guards.check_style_blocks)
    assert 'lib/views/B.svelte: 1' in fails(guards.check_raw_html)
    assert 'lib/c.ts: 1' in fails(guards.check_native_dialogs)
    emoji = fails(guards.check_emoji)
    assert 'lib/d.ts: 1' in emoji and 'lib/c.ts' not in emoji


def test_horizontal_scrollers_must_lock_their_vertical_overflow(tmp_path):
    guards = project(tmp_path, {
        'lib/views/A.svelte': '<div class="flex overflow-x-auto"></div>\n<div class="overflow-x-auto overflow-y-hidden"></div>\n',
        'lib/views/B.svelte': '<div class="overflow-auto"></div>\n',
    })
    message = fails(guards.check_horizontal_scrollers)
    assert 'lib/views/A.svelte: overflow-x-auto' in message and message.count('lib/views/A.svelte') == 1
    assert 'lib/views/B.svelte: overflow-auto' in message


def test_storage_is_limited_to_the_theme_the_shell_layout_and_named_files(tmp_path):
    guards = project(tmp_path, {
        'lib/markets.svelte.ts': "localStorage.setItem('ws.market', code)\n",
        'lib/views/A.svelte': "<script>sessionStorage.setItem('seen', '1')</script>\n",
    })
    message = fails(guards.check_storage)
    assert 'lib/views/A.svelte: 1' in message
    for allowed in ('lib/theme.ts', 'lib/shell/layout.svelte.ts', 'lib/markets.svelte.ts'):
        assert f'{allowed}: 1' not in message


def test_pages_start_with_page_and_have_exactly_one_h1(tmp_path):
    guards = project(tmp_path, {
        'routes/NoPage.svelte': CLEAN_PAGE.replace('<Page>', '<div class="grid gap-6">').replace('</Page>', '</div>'),
        'routes/NoTitle.svelte': CLEAN_PAGE.replace('level={1}', 'level={2}'),
        'routes/TwoTitles.svelte': CLEAN_PAGE.replace('<a href', '<PageHeader title="又一个" level={1} />\n  <a href'),
        'lib/views/Raw.svelte': '<h1>标题</h1>\n',
    })
    assert 'routes/NoPage.svelte: starts with <div>' in fails(guards.check_page_roots)
    assert 'routes/Overview.svelte' not in fails(guards.check_page_roots)
    message = fails(guards.check_single_h1)
    assert 'routes/NoTitle.svelte: 0' in message and 'routes/TwoTitles.svelte: 2' in message
    assert 'routes/Overview.svelte' not in message and 'routes/NoPage.svelte' not in message


def test_a_raw_h1_is_allowed_only_in_the_top_bar(tmp_path):
    guards = project(tmp_path, {'lib/views/Raw.svelte': '<h1>标题</h1>\n'})
    message = fails(guards.check_single_h1)
    assert 'lib/views/Raw.svelte: 1' in message and 'lib/shell/TopBar.svelte' not in message


def test_the_scan_must_see_the_project(tmp_path):
    guards = project(tmp_path, {})
    assert 'only' in fails(lambda: guards.check_not_vacuous(minimum=25))
    assert 'lib/api.ts is not scanned' in fails(lambda: guards.check_not_vacuous(known=('lib/api.ts',), minimum=1))
    no_pages = Guards(tmp_path, page_files=('pages/*.svelte',))
    assert 'no file matches' in fails(lambda: no_pages.check_not_vacuous(minimum=1))
