"""scripts/sync.py：同步到一个项目、锁文件、`--check`，以及清单本身与仓库的一致性。离线，不联网。"""
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))

import sync  # noqa: E402


def _write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding='utf-8')


def make_source(tmp_path: Path) -> Path:
    """A small stand-in for the Meridian repository."""
    root = tmp_path / 'source'
    _write(root / 'VERSION', '1.2.3\n')
    _write(root / 'web/src/styles/tokens.css', ':root { --radius: 8px; }\n')
    _write(root / 'web/src/lib/ui/button/button.svelte', '<button></button>\n')
    _write(root / 'web/src/lib/ui/domain/Page.svelte', '<div></div>\n')
    _write(root / 'web/src/lib/ui/.DS_Store', 'junk')
    _write(root / 'web/src/lib/ui/node_modules/x.js', 'junk')
    _write(root / 'web/src/lib/app/status.ts', "export const mine = 'gallery'\n")
    _write(root / 'templates/web/src/lib/app/status.ts', 'export const TONES = {}\n')
    _write(root / 'templates/web/src/styles/project.css', '/* project */\n')
    _write(root / sync.MANIFEST, json.dumps({
        'synced': ['web/src/styles/tokens.css', 'web/src/lib/ui/**'],
        'templates': ['web/src/lib/app/status.ts', 'web/src/styles/project.css'],
        'dependencies': {'svelte': '^5.56.4', 'bits-ui': '2.20.2'},
    }))
    return root


def make_target(tmp_path: Path, package: bool = True) -> Path:
    target = tmp_path / 'project'
    target.mkdir()
    if package:
        _write(target / 'web/package.json', json.dumps({
            'dependencies': {'svelte': '^5.56.4', 'bits-ui': '2.20.2'}, 'devDependencies': {'vitest': '^4.1.9'},
        }))
    return target


def run_sync(root: Path, target: Path, **kwargs):
    lines = []
    code = sync.sync(root, target, out=lines.append, **kwargs)
    return code, lines


def run_check(root: Path, target: Path):
    lines = []
    code = sync.check(root, target, out=lines.append)
    return code, lines


def lock_of(target: Path) -> dict:
    return json.loads((target / sync.LOCK).read_text(encoding='utf-8'))


def refused(action) -> str:
    """The message of the SyncError `action` must raise."""
    try:
        action()
    except sync.SyncError as error:
        return str(error)
    raise AssertionError('expected a SyncError')


def test_sync_copies_the_synced_files_and_writes_the_lock(tmp_path):
    root, target = make_source(tmp_path), make_target(tmp_path)
    code, _ = run_sync(root, target, allow_dirty=True)
    assert code == 0
    files = ['web/src/lib/ui/button/button.svelte', 'web/src/lib/ui/domain/Page.svelte', 'web/src/styles/tokens.css']
    for rel in files:
        assert (target / rel).read_bytes() == (root / rel).read_bytes()
    assert not (target / 'web/src/lib/ui/.DS_Store').exists()
    assert not (target / 'web/src/lib/ui/node_modules').exists()
    lock = lock_of(target)
    assert sorted(lock['files']) == files
    assert lock['files']['web/src/styles/tokens.css'] == sync.sha256(root / 'web/src/styles/tokens.css')
    assert lock['meridian'] == {'version': '1.2.3', 'commit': None, 'dirty': True}


def test_templates_are_created_once_and_never_overwritten(tmp_path):
    root, target = make_source(tmp_path), make_target(tmp_path)
    _write(target / 'web/src/lib/app/status.ts', 'export const TONES = { mine: {} }\n')
    _, lines = run_sync(root, target, allow_dirty=True)
    assert (target / 'web/src/lib/app/status.ts').read_text(encoding='utf-8') == 'export const TONES = { mine: {} }\n'
    assert (target / 'web/src/styles/project.css').read_text(encoding='utf-8') == '/* project */\n'
    assert any('web/src/styles/project.css' in line for line in lines)
    assert not any('lib/app/status.ts' in line for line in lines)
    # the source's own extension file is not what a project gets, and templates are not locked
    assert 'web/src/lib/app/status.ts' not in lock_of(target)['files']
    _write(target / 'web/src/styles/project.css', ':root { --gap: 1px; }\n')
    run_sync(root, target, allow_dirty=True)
    assert (target / 'web/src/styles/project.css').read_text(encoding='utf-8') == ':root { --gap: 1px; }\n'


def test_check_is_clean_right_after_a_sync_and_sync_is_idempotent(tmp_path):
    root, target = make_source(tmp_path), make_target(tmp_path)
    run_sync(root, target, allow_dirty=True)
    assert run_check(root, target)[0] == 0
    before = (target / sync.LOCK).read_bytes()
    _, lines = run_sync(root, target, allow_dirty=True)
    assert (target / sync.LOCK).read_bytes() == before
    assert any('其中 0 个有更新' in line for line in lines)


def test_check_reports_edited_missing_and_outdated_files(tmp_path):
    root, target = make_source(tmp_path), make_target(tmp_path)
    assert run_check(root, target)[0] == 1  # never synced
    run_sync(root, target, allow_dirty=True)
    _write(target / 'web/src/styles/tokens.css', ':root { --radius: 4px; }\n')
    (target / 'web/src/lib/ui/domain/Page.svelte').unlink()
    code, lines = run_check(root, target)
    text = '\n'.join(lines)
    assert code == 1
    assert '内容不同：web/src/styles/tokens.css' in text
    assert '缺少：web/src/lib/ui/domain/Page.svelte' in text
    # a sync repairs the project; then the source moves on and the project is behind
    run_sync(root, target, allow_dirty=True)
    assert run_check(root, target)[0] == 0
    _write(root / 'web/src/lib/ui/button/button.svelte', '<button class="x"></button>\n')
    _write(root / 'VERSION', '1.3.0\n')
    code, lines = run_check(root, target)
    text = '\n'.join(lines)
    assert code == 1
    assert '内容不同：web/src/lib/ui/button/button.svelte' in text
    assert '版本：项目锁在 1.2.3，Meridian 是 1.3.0' in text


def test_files_dropped_from_the_manifest_are_removed_from_the_project(tmp_path):
    root, target = make_source(tmp_path), make_target(tmp_path)
    run_sync(root, target, allow_dirty=True)
    _write(target / 'web/src/lib/ui/domain/Mine.svelte', '<p>project component</p>\n')
    (root / 'web/src/lib/ui/domain/Page.svelte').unlink()
    (root / 'web/src/lib/ui/button/button.svelte').unlink()
    assert any('已不在清单里' in line for line in run_check(root, target)[1])
    _, lines = run_sync(root, target, allow_dirty=True)
    assert not (target / 'web/src/lib/ui/domain/Page.svelte').exists()
    assert not (target / 'web/src/lib/ui/button').exists()  # the emptied directory goes too
    assert (target / 'web/src/lib/ui/domain/Mine.svelte').exists()  # the project's own file stays
    assert sorted(lock_of(target)['files']) == ['web/src/styles/tokens.css']
    assert sum('删除' in line for line in lines) == 2
    assert run_check(root, target)[0] == 0


def test_dependency_versions_must_match_the_manifest(tmp_path):
    root, target = make_source(tmp_path), make_target(tmp_path)
    _write(target / 'web/package.json', json.dumps({'dependencies': {'svelte': '^5.0.0'}}))
    message = refused(lambda: run_sync(root, target, allow_dirty=True))
    assert 'svelte：清单要 ^5.56.4，项目里是 ^5.0.0' in message
    assert 'bits-ui：清单要 2.20.2，项目里是 没有' in message
    assert not (target / sync.LOCK).exists()
    assert not (target / 'web/src/styles/tokens.css').exists()
    assert any('依赖版本：svelte' in line for line in run_check(root, target)[1])


def test_a_project_without_package_json_is_synced_with_a_note(tmp_path):
    root, target = make_source(tmp_path), make_target(tmp_path, package=False)
    code, lines = run_sync(root, target, allow_dirty=True)
    assert code == 0
    assert any('跳过依赖版本检查' in line for line in lines)
    assert run_check(root, target)[0] == 0


def test_a_dirty_source_is_refused_without_allow_dirty(tmp_path):
    root, target = make_source(tmp_path), make_target(tmp_path)
    assert '未提交' in refused(lambda: run_sync(root, target))
    assert not (target / sync.LOCK).exists()


def test_a_committed_source_writes_a_clean_lock(tmp_path):
    if shutil.which('git') is None:
        return
    root, target = make_source(tmp_path), make_target(tmp_path)

    def git(*args):
        subprocess.run(['git', '-C', str(root), '-c', 'user.name=t', '-c', 'user.email=t@example.invalid', *args],
                       check=True, capture_output=True)
    git('init', '-q')
    git('add', '-A')
    git('commit', '-q', '-m', 'first')
    code, lines = run_sync(root, target)
    assert code == 0
    lock = lock_of(target)
    assert lock['meridian']['dirty'] is False
    assert len(lock['meridian']['commit']) == 40
    assert not any('dirty' in line for line in lines)
    _write(root / 'web/src/styles/tokens.css', ':root { --radius: 6px; }\n')
    assert '未提交' in refused(lambda: run_sync(root, target))


def test_the_source_cannot_be_synced_into_itself_and_paths_stay_inside(tmp_path):
    root, target = make_source(tmp_path), make_target(tmp_path)
    assert 'Meridian 自己' in refused(lambda: run_sync(root, root, allow_dirty=True))
    assert '不存在' in refused(lambda: run_sync(root, tmp_path / 'missing', allow_dirty=True))
    run_sync(root, target, allow_dirty=True)
    lock = lock_of(target)
    lock['files']['../outside.txt'] = 'x'
    _write(target / sync.LOCK, json.dumps(lock))
    _write(tmp_path / 'outside.txt', 'keep me')
    assert '不合法的路径' in refused(lambda: run_sync(root, target, allow_dirty=True))
    assert (tmp_path / 'outside.txt').read_text(encoding='utf-8') == 'keep me'


def test_main_exit_codes(tmp_path):
    target = make_target(tmp_path, package=False)
    assert sync.main([str(tmp_path / 'missing')]) == 2
    assert sync.main([str(target), '--check']) == 1


# ------------------------------------------------------------------------------------- the real manifest and repository

def test_the_real_manifest_resolves_and_matches_package_json():
    manifest = sync.load_manifest(ROOT)
    files = sync.synced_files(ROOT, manifest)
    assert len(files) > 100
    for known in ('web/src/styles/tokens.css', 'web/src/lib/ui/button/button.svelte', 'web/src/lib/shell/AppShell.svelte',
                  'web/src/lib/ui/domain/status.ts', 'web/meridian.lock.test.js', 'tests/meridian_guards.py'):
        assert known in files, known
    for rel in manifest['templates']:
        assert (ROOT / sync.TEMPLATES / rel).is_file(), f'missing template {rel}'
        assert rel not in files, f'{rel} is a project file, it cannot also be synced'
    package = json.loads((ROOT / sync.PACKAGE).read_text(encoding='utf-8'))
    installed = {**package['devDependencies'], **package['dependencies']}
    for name, version in manifest['dependencies'].items():
        assert installed.get(name) == version, f'{name}: manifest {version}, package.json {installed.get(name)}'


def test_synced_files_do_not_name_a_project():
    """Synced files are copied verbatim into every project: none may mention one."""
    manifest = sync.load_manifest(ROOT)
    bad = []
    for rel in sync.synced_files(ROOT, manifest):
        text = (ROOT / rel).read_text(encoding='utf-8')
        bad.extend(f'{rel}: {word}' for word in ('Windrose', 'Bearing', 'windrose', 'investment') if word in text)
    assert not bad, 'project names in synced files:\n  ' + '\n  '.join(bad)


def test_synced_files_only_import_synced_or_contract_modules():
    """A synced file may import `$lib/…` modules that are synced too, or one of the project extension files."""
    manifest = sync.load_manifest(ROOT)
    files = set(sync.synced_files(ROOT, manifest))
    contract = {'$lib/app/status', '$lib/app/status.ts', '$lib/app/icons', '$lib/api'}
    bad = []
    for rel in sorted(files):
        if not rel.startswith('web/src/'):
            continue
        text = (ROOT / rel).read_text(encoding='utf-8')
        for spec in re.findall(r'''(?:from|import|mock)\s*\(?\s*['"](\$lib/[^'"?]+)''', text):
            if spec in contract:
                continue
            base = 'web/src/lib/' + spec[len('$lib/'):]
            base = base[:-3] if base.endswith('.js') else base
            candidates = (base, base + '.ts', base + '.svelte', base + '.svelte.ts', base + '/index.ts')
            if not any(candidate in files for candidate in candidates):
                bad.append(f'{rel}: {spec}')
    assert not bad, 'synced files importing modules a project may not have:\n  ' + '\n  '.join(bad)
