from __future__ import annotations

import argparse
import re
from dataclasses import dataclass
from pathlib import Path


CHECKBOX_RE = re.compile(r"^(?P<indent>\s*[-*]\s+)\[(?P<state>[ xX])\]\s+(?P<text>.+?)\s*$")


@dataclass
class TodoItem:
    line_index: int
    checked: bool
    text: str
    raw_line: str
    indent_level: int


def _read_lines(path: Path) -> list[str]:
    return path.read_text(encoding="utf-8").splitlines()


def _write_lines(path: Path, lines: list[str]) -> None:
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def parse_items(lines: list[str]) -> list[TodoItem]:
    items: list[TodoItem] = []
    for index, line in enumerate(lines):
        match = CHECKBOX_RE.match(line)
        if not match:
            continue
        indent = match.group("indent")
        items.append(
            TodoItem(
                line_index=index,
                checked=match.group("state").lower() == "x",
                text=match.group("text").strip(),
                raw_line=line,
                indent_level=len(indent.replace("-", "").replace("*", "")),
            )
        )
    return items


def update_item_state(lines: list[str], query: str, checked: bool) -> bool:
    items = parse_items(lines)
    matches = [item for item in items if query.lower() in item.text.lower()]
    if not matches:
        return False
    target = matches[0]
    prefix = target.raw_line.split("[")[0]
    lines[target.line_index] = f"{prefix}[{'x' if checked else ' '}] {target.text}"
    return True


def build_status_report(lines: list[str], source_name: str) -> str:
    items = parse_items(lines)
    top_level = [item for item in items if item.indent_level <= 2]
    nested = [item for item in items if item.indent_level > 2]
    done = [item.text for item in top_level if item.checked]
    pending = [item.text for item in top_level if not item.checked]
    nested_done = [item.text for item in nested if item.checked]
    nested_pending = [item.text for item in nested if not item.checked]
    total = len(items)
    percent = round((len(done) / total) * 100, 1) if total else 0.0
    report = [
        f"# {source_name} Status Snapshot",
        "",
        f"- Total checklist items: {total}",
        f"- Top-level done: {len(done)}",
        f"- Top-level pending: {len(pending)}",
        f"- Nested done: {len(nested_done)}",
        f"- Nested pending: {len(nested_pending)}",
        f"- Completion (top-level basis): {round((len(done) / len(top_level)) * 100, 1) if top_level else 0.0}%",
        "",
        "## Top-Level Done",
    ]
    report.extend([f"- [x] {text}" for text in done] or ["- None yet"])
    report.extend(["", "## Top-Level Pending"])
    report.extend([f"- [ ] {text}" for text in pending] or ["- None"])
    report.extend(["", "## Nested Done"])
    report.extend([f"- [x] {text}" for text in nested_done] or ["- None yet"])
    report.extend(["", "## Nested Pending"])
    report.extend([f"- [ ] {text}" for text in nested_pending] or ["- None"])
    return "\n".join(report) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Update and summarize shared markdown todo lists.")
    parser.add_argument("todo_file", nargs="?", default="TODO_LIST_V3_0.md", help="Path to the shared markdown todo file")
    parser.add_argument("--mark", action="append", default=[], help="Mark the first matching task as done (substring match).")
    parser.add_argument("--unmark", action="append", default=[], help="Mark the first matching task as pending (substring match).")
    parser.add_argument("--summary", action="store_true", help="Print a summary without modifying anything.")
    parser.add_argument("--output", default="TODO_LIST_V3_0_STATUS.md", help="Path to the generated status snapshot file.")
    args = parser.parse_args()

    todo_path = Path(args.todo_file)
    if not todo_path.exists():
        raise SystemExit(f"Todo file not found: {todo_path}")

    lines = _read_lines(todo_path)
    changed = False
    for query in args.mark:
        changed = update_item_state(lines, query, True) or changed
    for query in args.unmark:
        changed = update_item_state(lines, query, False) or changed

    if changed:
        _write_lines(todo_path, lines)

    report = build_status_report(lines, todo_path.name)
    output_path = Path(args.output)
    output_path.write_text(report, encoding="utf-8")

    if args.summary or not (args.mark or args.unmark):
        print(report)
    else:
        print(f"Updated {todo_path} and wrote {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
