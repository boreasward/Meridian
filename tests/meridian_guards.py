"""Meridian 的通用设计守护：静态检查一个项目的 `web/src`（规则见 Meridian 的 docs/design-system.md「守护」一节）。

这是同步文件，各项目里的副本逐字相同；项目的范围与白名单由它自己的 tests/test_frontend_design_guards.py 传给 `Guards`。
离线：只读源文件，不连库、不联网、不构建。零基线、零容忍：没有按文件的豁免。"""
import re
from fnmatch import fnmatch
from pathlib import Path

# --------------------------------------------------------------------------------------------------------------- patterns

_PALETTE = ('red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|'
            'slate|gray|zinc|neutral|stone')
_UTILITY = ('text|bg|border(?:-[trblxyse])?|ring(?:-offset)?|fill|stroke|divide|outline|decoration|from|via|to|'
            'shadow|accent|caret|placeholder')
RAW_PALETTE_RE = re.compile(rf'(?<![\w-])(?:[\w-]+:)*(?:{_UTILITY})-(?:{_PALETTE})-\d{{2,3}}')
# `white` / `black` are raw colours too (the tokens are background / foreground)
BLACK_WHITE_RE = re.compile(rf'(?<![\w-])(?:{_UTILITY})-(?:white|black)\b')
# `#abc` style literals; the lookbehind skips `&#123;` entities and `foo#bar`, the lookahead skips hash routes such as
# `#digests/…` and `#a-b`.
HEX_RE = re.compile(r'(?<![&\w])#[0-9a-fA-F]{3,8}\b(?![\w/-])')
COLOR_FN_RE = re.compile(r'\b(?:rgba?|hsla?|oklch)\(')
EMOJI_RE = re.compile('[\U0001F000-\U0001FAFF☀-➿⌀-⏿⬀-⯿️]')
STYLE_RE = re.compile(r'<style\b')
BUTTON_RE = re.compile(r'<button(?![\w-])')
H1_RE = re.compile(r'<h1(?![\w-])')
DIALOG_RES = (
    re.compile(r'\b(?:window|globalThis)\??\.(?:confirm|alert|prompt)\b'),
    re.compile(r'(?<![\w.$])(?:alert|prompt)\('),
    # a bare `confirm('…')` is the native dialog; a local `function confirm()` or `x.confirm(` is not
    re.compile(r'(?<![\w.$])(?<!function )confirm\(\s*[\'"`]'),
)
# `{@html expr}`; Svelte skips whitespace after the `{`, so `{ @html x }` and `{\n@html x}` are tags too
HTML_RE = re.compile(r'\{\s*@html\b')
# the DOM routes around `{@html}`: text from data must never be parsed as markup
DOM_HTML_RE = re.compile(r'\.(?:innerHTML|outerHTML)\b|\binsertAdjacentHTML\b|\bdocument\.write(?:ln)?\b')
# an inline `style="…"` / `style={…}` / `style:prop={…}` attribute (not a `const style = …` assignment)
STYLE_ATTR_RE = re.compile(r'(?<=\s)(?<!const )(?<!let )(?<!var )style(?::[\w-]+)?\s*=\s*["\'{]')
STORAGE_RE = re.compile(r'\b(?:localStorage|sessionStorage|indexedDB)\b|\bdocument\.cookie\b')
LEVEL_ONE_RE = re.compile(r'\blevel\s*=\s*\{\s*1\s*\}')
SCROLLER_RE = re.compile(r'(?<![^\s"\'`])((?:[^\s"\'`:]+:)*)(overflow-(?:x-auto|x-scroll|auto|scroll))(?![\w-])')

# Files that may touch browser storage in every project: the theme, and what the shell remembers about its layout.
BASE_STORAGE_FILES = ('lib/theme.ts', 'lib/shell/layout.svelte.ts')
# The only file that writes an <h1> element itself (PageHeader builds its heading with <svelte:element>).
H1_FILES = ('lib/shell/TopBar.svelte',)

# ---------------------------------------------------------------------------------------------------------------- counting


def count_raw_palette(text: str) -> int:
    return len(RAW_PALETTE_RE.findall(text)) + len(BLACK_WHITE_RE.findall(text))


def count_hex_rgb(text: str) -> int:
    return len(HEX_RE.findall(text)) + len(COLOR_FN_RE.findall(text))


def count_emoji(text: str) -> int:
    return len(EMOJI_RE.findall(text))


def count_style_block(text: str) -> int:
    return len(STYLE_RE.findall(text))


def count_native_button(text: str) -> int:
    return len(BUTTON_RE.findall(text))


def count_h1(text: str) -> int:
    return len(H1_RE.findall(text))


def count_native_dialog(text: str) -> int:
    return sum(len(rx.findall(text)) for rx in DIALOG_RES)


def count_html(text: str) -> int:
    return len(HTML_RE.findall(text)) + len(DOM_HTML_RE.findall(text))


def count_style_attr(text: str) -> int:
    return len(STYLE_ATTR_RE.findall(text))


def count_storage(text: str) -> int:
    return len(STORAGE_RE.findall(text))


def unlocked_horizontal_scrollers(text: str) -> list:
    """Line by line: every `<variants>overflow-x-auto` / `<variants>overflow-x-scroll` needs `<same variants>overflow-y-hidden`
    on the same line (a box that scrolls sideways and overflows by one pixel vertically grows a stray vertical scrollbar
    wherever the OS always shows them). `overflow-auto` and `overflow-scroll`, with any prefix, are always violations.
    Returns the offending class names, prefix included."""
    found = []
    for line in text.splitlines():
        for match in SCROLLER_RE.finditer(line):
            prefix, name = match.groups()
            locked = re.search(rf'(?<![^\s"\'`]){re.escape(prefix)}overflow-y-hidden(?![\w-])', line)
            if name in ('overflow-auto', 'overflow-scroll') or not locked:
                found.append(prefix + name)
    return found


def _tag_source(text: str, start: int) -> str:
    """Source of an opening tag from `start` (just after the tag name) to its closing `>`: understands quotes and
    `{…}` expressions (so `=>` inside braces does not end the tag) and runs over line breaks."""
    depth = 0
    quote = ''
    i = start
    while i < len(text):
        ch = text[i]
        if quote:
            if ch == '\\':
                i += 1
            elif ch == quote:
                quote = ''
        elif ch in '\'"`':
            quote = ch
        elif ch == '{':
            depth += 1
        elif ch == '}':
            depth = max(0, depth - 1)
        elif ch == '>' and depth == 0:
            break
        i += 1
    return text[start:i]


def tags_named(text: str, names: str) -> list:
    """`(name, attribute source)` of every opening tag whose name matches the regex `names` (case-sensitive)."""
    return [(m.group(1), _tag_source(text, m.end())) for m in re.finditer(rf'<({names})(?=[\s>/])', text)]


_SCRIPT_RE = re.compile(r'<script\b.*?</script>', re.DOTALL)
_COMMENT_RE = re.compile(r'<!--.*?-->', re.DOTALL)
# an innermost `{#snippet …}…{/snippet}` block; applied until nothing changes, so nested ones go too
_SNIPPET_RE = re.compile(r'\{#snippet\b(?:(?!\{#snippet\b).)*?\{/snippet\}', re.DOTALL)
_FIRST_TAG_RE = re.compile(r'<([A-Za-z][\w:.-]*)')


def first_markup_tag(text: str):
    """Name of the first element a component renders: scripts, comments and snippet definitions do not count."""
    markup = _COMMENT_RE.sub('', _SCRIPT_RE.sub('', text))
    while True:
        stripped = _SNIPPET_RE.sub('', markup)
        if stripped == markup:
            break
        markup = stripped
    found = _FIRST_TAG_RE.search(markup)
    return found.group(1) if found else None


def count_level_one_headers(text: str) -> int:
    """`<PageHeader … level={1} …>` tags in a component."""
    return sum(1 for _, tag in tags_named(text, 'PageHeader') if LEVEL_ONE_RE.search(tag))


# ------------------------------------------------------------------------------------------------------------------ guards


class Guards:
    """The generic checks over one project's `web/src`. Every `check_*` raises AssertionError listing the files.

    button_scopes      prefixes (relative to web/src) where a raw `<button>` is banned; `lib/ui/**` writes the real one
    style_attr_scopes  prefixes where an inline `style=` is banned
    page_files         glob patterns of the files that are pages: each starts with `<Page>` and has exactly one
                       `PageHeader level={1}`
    storage_files      extra files allowed to touch browser storage, on top of the theme and the shell layout
    """

    def __init__(self, root: Path, *,
                 button_scopes=('routes/', 'lib/views/', 'lib/shell/', 'lib/components/'),
                 style_attr_scopes=('routes/', 'lib/views/', 'lib/shell/', 'lib/ui/domain/'),
                 page_files=('routes/*.svelte',),
                 storage_files=()):
        self.root = Path(root)
        self.web = self.root / 'web'
        self.src = self.web / 'src'
        self.button_scopes = tuple(button_scopes)
        self.style_attr_scopes = tuple(style_attr_scopes)
        self.page_patterns = tuple(page_files)
        self.storage_files = (*BASE_STORAGE_FILES, *storage_files)

    # ---- files

    def rel(self, path: Path) -> str:
        return path.relative_to(self.src).as_posix()

    def scanned_files(self) -> list:
        """Every `.svelte` / `.ts` under web/src except tests, fixtures and the vitest setup."""
        found = []
        for path in sorted(self.src.rglob('*')):
            if path.suffix not in ('.svelte', '.ts') or not path.is_file():
                continue
            name = path.name
            if name.endswith(('.test.ts', '-fixtures.ts')) or name == 'vitest-setup.ts':
                continue
            found.append(path)
        return found

    def page_files(self) -> list:
        return [p for p in self.scanned_files() if any(fnmatch(self.rel(p), pattern) for pattern in self.page_patterns)]

    @staticmethod
    def _read(path: Path) -> str:
        return path.read_text(encoding='utf-8')

    def _counted(self, counter, *, svelte_only=False, scopes=None, allowed=()) -> list:
        """`file: n` for every scanned file (inside `scopes`, outside `allowed`) where `counter(text)` is not zero."""
        found = []
        for path in self.scanned_files():
            r = self.rel(path)
            if r in allowed or (svelte_only and path.suffix != '.svelte') or (scopes is not None and not r.startswith(scopes)):
                continue
            n = counter(self._read(path))
            if n:
                found.append(f'{r}: {n}')
        return found

    @staticmethod
    def _hits(violations: list, title: str, hint: str = ''):
        assert not violations, f'{title}{hint}:\n  ' + '\n  '.join(violations)

    # ---- checks

    def check_raw_palette(self):
        """Tailwind palette colours (`text-red-600`) and `text/bg/border-white|black` are banned; use semantic tokens."""
        self._hits(self._counted(count_raw_palette), 'raw palette classes found',
                   ' — use semantic token classes (bg-muted, text-muted-foreground, border-border …)')

    def check_hex_rgb(self):
        """Colours come from the token files, never inline literals."""
        self._hits(self._counted(count_hex_rgb), 'colour literals found', ' — use token classes or `var(--token)`')

    def check_emoji(self):
        """Emoji and pictographs are banned; icons come from `Icon` (lucide). Arrows, ① and ▲ ● are typography."""
        self._hits(self._counted(count_emoji), 'emoji found', ' — use <Icon> or plain text')

    def check_style_blocks(self):
        """No component `<style>` blocks, anywhere."""
        self._hits(self._counted(count_style_block, svelte_only=True), '<style> blocks found',
                   ' — use Tailwind classes or styles/*.css')

    def check_native_buttons(self):
        """Pages, views and the shell use `Button`; only `lib/ui/**` writes `<button>`."""
        self._hits(self._counted(count_native_button, svelte_only=True, scopes=self.button_scopes),
                   'raw <button> found', ' — use <Button> from $lib/ui')

    def check_native_dialogs(self):
        """No `window.confirm/alert/prompt` or bare `alert(` / `prompt(`."""
        self._hits(self._counted(count_native_dialog), 'native dialogs found', ' — use ConfirmDialog / notify')

    def check_raw_html(self):
        """Text is shown as text: no `{@html`, no innerHTML / outerHTML / insertAdjacentHTML / document.write."""
        self._hits(self._counted(count_html), 'raw HTML found', ' — render text as text')

    def check_style_attrs(self):
        """`style=` attributes are banned in pages, views, the shell and lib/ui/domain/ (shadcn copies excepted)."""
        self._hits(self._counted(count_style_attr, svelte_only=True, scopes=self.style_attr_scopes),
                   'inline style attributes found', ' — use Tailwind classes')

    def check_storage(self):
        """localStorage / sessionStorage / indexedDB / document.cookie only in the theme, the shell layout and the
        files the project names."""
        self._hits(self._counted(count_storage, allowed=self.storage_files), 'browser storage outside the allowed files',
                   f' — allowed: {", ".join(self.storage_files)}')

    def check_horizontal_scrollers(self):
        """A container that only scrolls sideways locks its vertical overflow, on the same line and with the same
        variant prefix; `overflow-auto` / `overflow-scroll` are not used at all."""
        bad = []
        for path in self.scanned_files():
            bad.extend(f'{self.rel(path)}: {name}' for name in unlocked_horizontal_scrollers(self._read(path)))
        self._hits(bad, 'horizontal scrollers that can also scroll vertically',
                   ' — add the same-prefix overflow-y-hidden on the same line')

    def check_page_roots(self):
        """Every page starts with `<Page>`: padding, width and the gap between its parts are set in one place."""
        bad = []
        for path in self.page_files():
            first = first_markup_tag(self._read(path))
            if first != 'Page':
                bad.append(f'{self.rel(path)}: starts with <{first}>')
        self._hits(bad, 'pages whose root is not <Page>', ' — wrap the page in <Page> from $lib/ui/domain/Page.svelte')

    def check_single_h1(self):
        """Every page has exactly one `PageHeader level={1}`, and nothing but the shell's top bar writes an <h1>."""
        bad = []
        for path in self.page_files():
            n = count_level_one_headers(self._read(path))
            if n != 1:
                bad.append(f'{self.rel(path)}: {n} PageHeader level={{1}}')
        self._hits(bad, 'pages without exactly one level-1 PageHeader')
        self._hits(self._counted(count_h1, svelte_only=True, allowed=H1_FILES), 'raw <h1> found',
                   ' — the page title is <PageHeader level={1}>')

    def check_not_vacuous(self, known=(), minimum=25):
        """The scan sees the project: enough files, the named ones among them, and at least one page."""
        scanned = {self.rel(p) for p in self.scanned_files()}
        assert len(scanned) >= minimum, f'only {len(scanned)} files scanned'
        for name in known:
            assert name in scanned, f'{name} is not scanned'
        assert self.page_files(), f'no file matches the page patterns {self.page_patterns}'

    def check_all(self):
        for check in (self.check_raw_palette, self.check_hex_rgb, self.check_emoji, self.check_style_blocks,
                      self.check_native_buttons, self.check_native_dialogs, self.check_raw_html, self.check_style_attrs,
                      self.check_storage, self.check_horizontal_scrollers, self.check_page_roots, self.check_single_h1):
            check()


# ---------------------------------------------------------------------------------------------------- guard self-checks


def self_check():
    """Each pattern catches a real violation and stays quiet on look-alikes (hash routes, entities, CSS vars, typography)."""
    # raw palette
    assert count_raw_palette('class="text-red-600 hover:bg-amber-700/50 dark:border-slate-200"') == 3
    assert count_raw_palette('class="md:from-blue-500 ring-offset-white text-black bg-white"') == 4
    assert count_raw_palette('border-t-red-500 border-x-gray-200 border-e-sky-400 border-y-white border-l-black') == 5
    assert count_raw_palette('ring-offset-slate-100 shadow-blue-500 accent-pink-500 caret-lime-400 placeholder-gray-400') == 5
    assert count_raw_palette('fill-white stroke-black ring-white outline-black divide-white decoration-black via-white to-black') == 8
    assert count_raw_palette('border border-t border-x ring ring-2 shadow-md shadow-sm outline-none divide-y accent-auto') == 0
    assert count_raw_palette('border-border ring-ring placeholder-muted-foreground photo-white auto-black') == 0
    assert count_raw_palette('class="text-success bg-muted border-border text-foreground bg-card text-whitespace"') == 0
    assert count_raw_palette('fill-primary stroke-primary-foreground text-neutral bg-neutral/10 border-neutral/40') == 0
    # hex / rgb
    assert count_hex_rgb("color: '#26a69a'; fill: #fff; x: #ff000080") == 3
    assert count_hex_rgb('rgba(0,0,0,.5) hsl(10 20% 30%) oklch(0.5 0.1 20) rgb(1,2,3)') == 4
    assert count_hex_rgb('href="#digests/2026-11-14" href="#sources" href="#sources/active" &#128512; &#x27; var(--info)') == 0
    assert count_hex_rgb('href="#runs" href="#a-b" const rgbaLike = 1; frgb(1)') == 0
    # emoji
    assert count_emoji('✅ 成功 \U0001F680 ⚠️ ⏰ ⭐') == 6
    assert count_emoji('① → ↗ ▲ ● ▼ — · … ×') == 0
    # style / button / h1 / html / dialogs
    assert count_style_block('<script></script>\n<style>\n.a{}\n</style>') == 1
    assert count_style_block('<styled-thing> style="x" <svelte:head>') == 0
    assert count_native_button('<button type="button">x</button> <button\n class="a">') == 2
    assert count_native_button('<Button>x</Button> <buttons> <button-group>') == 0
    assert count_h1('<h1>标题</h1> <h1\n class="x">') == 2
    assert count_h1('<h10> <h1-x> <H1> <svelte:element this={`h${level}`}> h1') == 0
    assert count_html('{@html body}\n{@html other}') == 2
    assert count_html('{ @html x }') == 1
    assert count_html('{\n@html x}') == 1
    assert count_html('{html} the word html, an @html mention, <p>html</p>, {htmlish}') == 0
    assert count_html('el.innerHTML = x; el.outerHTML = y; a.insertAdjacentHTML("beforeend", z); document.write(w)') == 4
    assert count_html('const innerHTMLish = 1; textContent = x; html.innerText') == 0
    assert count_native_dialog('if (window.confirm("x")) {} window.alert(1); prompt("y"); alert(2)') == 4
    assert count_native_dialog('window?.confirm("x"); globalThis.alert(1); globalThis.prompt("y"); globalThis.confirm(1)') == 4
    assert count_native_dialog('if (confirm("sure?")) {} confirm(\'x\'); confirm(`y`); confirm( "z")') == 4
    assert count_native_dialog('notify.success("x"); confirmDialog(); this.alert(1); toast.alert(2); prompts(1); myprompt(1)') == 0
    assert count_native_dialog('function confirm() { go() } onclick={confirm} dialog.confirm("x"); x.confirm(1); confirm()') == 0
    # inline style attributes
    assert count_style_attr('<div style="width: 3px"> <p style={x}> <b  style:color={c}>') == 3
    assert count_style_attr('<div class="x"> const style = { a: 1 }; let style = 2; restyle = 3; data-style="x" <Card styles={x}>') == 0
    # storage
    assert count_storage("localStorage.setItem('a', b); sessionStorage.x; indexedDB.open('d'); document.cookie = 'x'") == 4
    assert count_storage("matchMedia('(prefers-color-scheme: dark)'); const storageKey = 1; cookieless()") == 0
    # horizontal scrollers lock their vertical overflow with the same variant prefix
    assert unlocked_horizontal_scrollers('class="flex overflow-x-auto"') == ['overflow-x-auto']
    assert unlocked_horizontal_scrollers('class="overflow-x-scroll"') == ['overflow-x-scroll']
    assert unlocked_horizontal_scrollers('class="overflow-x-auto overflow-y-hidden"') == []
    assert unlocked_horizontal_scrollers("'max-lg:overflow-x-auto overflow-y-hidden'") == ['max-lg:overflow-x-auto']  # the prefix must match
    assert unlocked_horizontal_scrollers("'lg:in-data-[slot=card]:overflow-x-auto lg:in-data-[slot=card]:overflow-y-hidden'") == []
    assert unlocked_horizontal_scrollers('class="overflow-auto" x="md:overflow-scroll"') == ['overflow-auto', 'md:overflow-scroll']
    assert unlocked_horizontal_scrollers("overflow-hidden overflow-x-hidden lg:overflow-visible box.style.overflowX = 'auto'") == []
    # the first element of a component
    assert first_markup_tag('<script lang="ts">\n  const a = "<div>"\n</script>\n\n<Page>\n  <PageHeader />\n</Page>') == 'Page'
    assert first_markup_tag('<script module>x</script><script>y</script>\n<!-- <div> -->\n{#snippet a(x)}<span>{x}</span>{/snippet}\n<Page width="full">') == 'Page'
    assert first_markup_tag('{#snippet a()}{#snippet b()}<i></i>{/snippet}<b></b>{/snippet}\n<div class="grid"><Page /></div>') == 'div'
    assert first_markup_tag('<script>let a = 1</script>\n{#if a}<Page />{/if}') == 'Page'
    assert first_markup_tag('<script>let a = 1</script>\n') is None
    # level-1 page headers
    assert count_level_one_headers('<PageHeader title="概览" level={1}>') == 1
    assert count_level_one_headers('<PageHeader\n  level={ 1 }\n  title={a > b ? x : y}\n/>') == 1
    assert count_level_one_headers('<PageHeader title="段" level={2} /> <PageHeader title="默认" /> <PageHeaderX level={1} />') == 0
    assert count_level_one_headers('<PageHeader level={1} title="a" /><PageHeader title="b" level={1} />') == 2
