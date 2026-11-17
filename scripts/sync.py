#!/usr/bin/env python3
"""把 Meridian 的同步文件复制到一个消费项目，并写它的锁文件 web/meridian.lock.json。

    python3 scripts/sync.py <项目根目录>            同步
    python3 scripts/sync.py <项目根目录> --check    只比较；有差异时退出码 1

同步做四件事：复制清单（meridian.manifest.json）里的同步文件；删除上一份锁文件里有、现在清单里没有的文件；
项目扩展文件不存在时按 templates/ 生成（已存在的不碰）；写锁文件（Meridian 的版本号、提交号、每个同步文件的 sha256）。

退出码：0 完成 / 无差异；1 `--check` 发现差异；2 不能同步（参数、清单、依赖版本、Meridian 有未提交改动）。
只用标准库。"""
import argparse
import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = 'meridian.manifest.json'
LOCK = 'web/meridian.lock.json'
PACKAGE = 'web/package.json'
TEMPLATES = 'templates'
SKIPPED_NAMES = {'.DS_Store'}
SKIPPED_DIRS = {'node_modules', 'dist', '__pycache__'}


class SyncError(Exception):
    """同步无法进行；消息是给人看的中文说明。"""


# ------------------------------------------------------------------------------------------------------------- reading

def load_manifest(root: Path) -> dict:
    path = root / MANIFEST
    if not path.is_file():
        raise SyncError(f'找不到清单 {path}')
    manifest = json.loads(path.read_text(encoding='utf-8'))
    for key, kind in (('synced', list), ('templates', list), ('dependencies', dict)):
        if not isinstance(manifest.get(key), kind):
            raise SyncError(f'清单缺少 {key}')
    return manifest


def _safe(rel: str) -> str:
    """A manifest or lock path must stay inside the project: relative, posix, without `..`."""
    pure = PurePosixPath(rel)
    if pure.is_absolute() or '..' in pure.parts or '\\' in rel or not pure.parts:
        raise SyncError(f'不合法的路径：{rel!r}')
    return pure.as_posix()


def synced_files(root: Path, manifest: dict) -> list:
    """清单里的同步文件，展开 `目录/**`，相对 Meridian 根目录的 posix 路径，按字典序。"""
    found = set()
    for pattern in manifest['synced']:
        pattern = _safe(pattern)
        if pattern.endswith('/**'):
            base = root / pattern[:-3]
            if not base.is_dir():
                raise SyncError(f'清单里的目录不存在：{pattern}')
            for path in base.rglob('*'):
                if not path.is_file() or path.name in SKIPPED_NAMES:
                    continue
                if SKIPPED_DIRS.intersection(path.relative_to(root).parts):
                    continue
                found.add(path.relative_to(root).as_posix())
        else:
            if not (root / pattern).is_file():
                raise SyncError(f'清单里的文件不存在：{pattern}')
            found.add(pattern)
    return sorted(found)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def version_of(root: Path) -> str:
    path = root / 'VERSION'
    return path.read_text(encoding='utf-8').strip() if path.is_file() else '0.0.0'


def git_state(root: Path):
    """`(提交号或 None, 是否有未提交改动)`；不是 git 仓库、还没有提交、没装 git 都算有未提交改动。"""
    def git(*args):
        return subprocess.run(['git', '-C', str(root), *args], capture_output=True, text=True)
    try:
        top = git('rev-parse', '--show-toplevel')
        if top.returncode != 0 or Path(top.stdout.strip()).resolve() != root.resolve():
            return None, True
        head = git('rev-parse', 'HEAD')
        if head.returncode != 0:
            return None, True
        status = git('status', '--porcelain')
        return head.stdout.strip(), status.returncode != 0 or bool(status.stdout.strip())
    except OSError:
        return None, True


def read_lock(target: Path):
    path = target / LOCK
    if not path.is_file():
        return None
    try:
        lock = json.loads(path.read_text(encoding='utf-8'))
    except ValueError as error:
        raise SyncError(f'{path} 不是合法的 JSON：{error}') from error
    if not isinstance(lock, dict) or not isinstance(lock.get('files'), dict):
        raise SyncError(f'{path} 的格式不对')
    for rel in lock['files']:
        _safe(rel)
    return lock


def dependency_problems(manifest: dict, target: Path):
    """`(problems, note)`：共用依赖在项目 package.json 里的版本与清单不一致的各一行；没有 package.json 时只给一句提示。"""
    path = target / PACKAGE
    if not path.is_file():
        return [], f'没有 {PACKAGE}，跳过依赖版本检查'
    package = json.loads(path.read_text(encoding='utf-8'))
    installed = {**package.get('devDependencies', {}), **package.get('dependencies', {})}
    problems = []
    for name, wanted in sorted(manifest['dependencies'].items()):
        have = installed.get(name)
        if have != wanted:
            problems.append(f'{name}：清单要 {wanted}，项目里是 {have if have is not None else "没有"}')
    return problems, ''


def resolve_target(root: Path, target) -> Path:
    target = Path(target).expanduser().resolve()
    if not target.is_dir():
        raise SyncError(f'项目目录不存在：{target}')
    if target == root.resolve() or (target / MANIFEST).exists():
        raise SyncError(f'{target} 是 Meridian 自己，不能同步到自己')
    return target


# -------------------------------------------------------------------------------------------------------------- compare

def differences(root: Path, target: Path, manifest: dict) -> list:
    """项目与 Meridian 当前内容的差异，每条一行；空列表就是没有差异。"""
    found = []
    files = synced_files(root, manifest)
    lock = read_lock(target)
    locked = lock['files'] if lock else {}
    if lock is None:
        found.append(f'没有锁文件 {LOCK}')
    elif lock.get('meridian', {}).get('version') != version_of(root):
        found.append(f'版本：项目锁在 {lock.get("meridian", {}).get("version")}，Meridian 是 {version_of(root)}')
    for rel in files:
        dest = target / rel
        want = sha256(root / rel)
        if not dest.is_file():
            found.append(f'缺少：{rel}')
        elif sha256(dest) != want:
            found.append(f'内容不同：{rel}')
        elif lock is not None and locked.get(rel) != want:
            found.append(f'锁文件未记录或记录不符：{rel}')
    for rel in sorted(set(locked) - set(files)):
        found.append(f'已不在清单里（下次同步会删除）：{rel}' if (target / rel).exists() else f'锁文件里多出：{rel}')
    problems, _ = dependency_problems(manifest, target)
    found.extend(f'依赖版本：{line}' for line in problems)
    return found


# ----------------------------------------------------------------------------------------------------------------- sync

def _remove_stale(target: Path, old_lock, keep: set, out) -> None:
    for rel in sorted(set(old_lock['files']) - keep) if old_lock else []:
        path = target / rel
        if path.is_file():
            path.unlink()
            out(f'删除（已不在清单里）：{rel}')
            parent = path.parent
            while parent != target and not any(parent.iterdir()):
                parent.rmdir()
                parent = parent.parent


def sync(root: Path, target, allow_dirty: bool = False, out=print) -> int:
    manifest = load_manifest(root)
    target = resolve_target(root, target)
    commit, dirty = git_state(root)
    if dirty and not allow_dirty:
        raise SyncError('Meridian 有未提交的改动（或还没有提交）。先提交，再同步；开发中可加 --allow-dirty，'
                        '但那样写出的锁文件过不了项目的锁文件测试')
    problems, note = dependency_problems(manifest, target)
    if problems:
        raise SyncError('共用依赖的版本与清单不一致，先改项目的 web/package.json：\n  ' + '\n  '.join(problems))
    files = synced_files(root, manifest)
    old_lock = read_lock(target)
    if note:
        out(note)

    copied = 0
    hashes = {}
    for rel in files:
        source, dest = root / rel, target / rel
        hashes[rel] = sha256(source)
        if dest.is_file() and sha256(dest) == hashes[rel]:
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, dest)
        copied += 1
    _remove_stale(target, old_lock, set(files), out)

    for rel in manifest['templates']:
        rel = _safe(rel)
        source, dest = root / TEMPLATES / rel, target / rel
        if not source.is_file():
            raise SyncError(f'清单里的模板不存在：{TEMPLATES}/{rel}')
        if not dest.exists():
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, dest)
            out(f'生成项目扩展文件：{rel}')

    lock = {
        'meridian': {'version': version_of(root), 'commit': commit, 'dirty': dirty},
        'files': hashes,
    }
    lock_path = target / LOCK
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    lock_path.write_text(json.dumps(lock, ensure_ascii=False, indent=2, sort_keys=True) + '\n', encoding='utf-8')
    out(f'已同步 Meridian {lock["meridian"]["version"]}：{len(files)} 个同步文件，其中 {copied} 个有更新'
        + ('；锁文件标了 dirty，提交前请在 Meridian 提交后重新同步' if dirty else ''))
    return 0


def check(root: Path, target, out=print) -> int:
    manifest = load_manifest(root)
    target = resolve_target(root, target)
    found = differences(root, target, manifest)
    if not found:
        out(f'无差异：{target} 与 Meridian {version_of(root)} 一致')
        return 0
    out(f'{target} 与 Meridian {version_of(root)} 有 {len(found)} 处差异：')
    for line in found:
        out(f'  {line}')
    return 1


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description='把 Meridian 的同步文件复制到一个消费项目')
    parser.add_argument('target', help='消费项目的根目录（里面有 web/）')
    parser.add_argument('--check', action='store_true', help='只比较，不写；有差异时退出码 1')
    parser.add_argument('--allow-dirty', action='store_true', help='Meridian 有未提交改动时也同步（锁文件会标 dirty）')
    args = parser.parse_args(argv)
    try:
        if args.check:
            return check(ROOT, args.target)
        return sync(ROOT, args.target, allow_dirty=args.allow_dirty)
    except SyncError as error:
        print(f'不能同步：{error}', file=sys.stderr)
        return 2


if __name__ == '__main__':
    sys.exit(main())
