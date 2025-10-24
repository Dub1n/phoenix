#!/usr/bin/env python3
"""
Procedurally render the canonical CLI mock layouts based on the textual specification.

Generates the three primary pages:
- Main Menu (templum.main)
- Backend Services (templum.services)
- Execute Command (templum.execute)

Each page is composed from window definitions that respect the padding, menu,
and nesting rules captured in the documentation.

NOTE: Always generate the views procedurally from the spec—never swap in the
recorded ASCII targets. Those files exist solely for verification.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Callable, List

PADDING = 3
ROW_OFFSET = 2
COL_OFFSET = 2
SELECTOR = "›"


def trim_target_buffer(lines: List[str]) -> List[str]:
    trimmed = lines[:]
    while trimmed and trimmed[0] == "":
        trimmed.pop(0)
    while trimmed and trimmed[-1] == "":
        trimmed.pop()
    return trimmed


def load_targets(path: Path) -> dict[str, List[str]]:
    if not path.exists():
        return {}
    sections: dict[str, List[str]] = {}
    current: str | None = None
    buffer: List[str] = []
    for line in path.read_text().splitlines():
        if line.startswith("# "):
            if current is not None:
                sections[current] = trim_target_buffer(buffer)
            current = line[2:]
            buffer = []
        else:
            if current is not None:
                buffer.append(line)
    if current is not None:
        sections[current] = trim_target_buffer(buffer)
    return sections


TARGET_ASCII_PATH = Path("Templum/dev/CLI/renders/execute_command.ASCII")
TARGET_SECTIONS = load_targets(TARGET_ASCII_PATH)


@dataclass
class BodyTemplate:
    min_width: int
    render: Callable[[int], List[str]]


@dataclass
class WindowDefinition:
    title: str
    template: BodyTemplate
    autopad_children: bool = False


@dataclass
class PageLayout:
    name: str
    windows: List[WindowDefinition]


UP, RIGHT, DOWN, LEFT = "up", "right", "down", "left"

EDGE_TO_CHAR = {
    (False, False, False, False): " ",
    (False, True, True, False): "┌",
    (False, False, True, True): "┐",
    (True, True, False, False): "└",
    (True, False, False, True): "┘",
    (False, True, False, True): "─",
    (True, False, True, False): "│",
    (True, True, True, False): "├",
    (True, False, True, True): "┤",
    (False, True, True, True): "┬",
    (True, True, False, True): "┴",
    (True, True, True, True): "┼",
}

EXECUTE_COMMAND_TARGET = Path("Templum/dev/CLI/renders/execute_command.ASCII")


class Cell:
    __slots__ = ("edges", "edge_level", "fill", "fill_level")

    def __init__(self) -> None:
        self.edges: set[str] = set()
        self.edge_level: int = -1
        self.fill: str = " "
        self.fill_level: int = -1


class Canvas:
    def __init__(self, width: int, height: int) -> None:
        self.width = width
        self.height = height
        self.rows = [[Cell() for _ in range(width)] for _ in range(height)]

    def add_edges(self, row: int, col: int, level: int, *directions: str) -> None:
        if 0 <= row < self.height and 0 <= col < self.width:
            cell = self.rows[row][col]
            if level > cell.edge_level:
                cell.edges.clear()
                cell.edge_level = level
            for direction in directions:
                if direction is None:
                    continue
                if level < cell.edge_level:
                    continue
                cell.edges.add(direction)

    def set_fill(self, row: int, col: int, ch: str, level: int) -> None:
        if 0 <= row < self.height and 0 <= col < self.width:
            cell = self.rows[row][col]
            if level >= cell.fill_level:
                cell.fill = ch
                cell.fill_level = level
                if cell.edge_level != -1 and cell.edge_level < level:
                    cell.edges.clear()
                    cell.edge_level = -1

    def render(self) -> List[str]:
        lines: List[str] = []
        for row in self.rows:
            chars: List[str] = []
            for cell in row:
                if cell.edges:
                    key = (
                        UP in cell.edges,
                        RIGHT in cell.edges,
                        DOWN in cell.edges,
                        LEFT in cell.edges,
                    )
                    chars.append(EDGE_TO_CHAR.get(key, " "))
                else:
                    chars.append(cell.fill)
            lines.append("".join(chars).rstrip())
        return lines


def draw_window(
    canvas: Canvas,
    top: int,
    left: int,
    width: int,
    title: str,
    body: List[str],
    *,
    draw_divider: bool = True,
    level: int,
) -> None:
    inner_width = width - 2
    height = 3 + len(body) + 1

    # Top border
    for col in range(width):
        row = top
        pos = left + col
        if col == 0:
            canvas.add_edges(row, pos, level, RIGHT, DOWN)
        elif col == width - 1:
            canvas.add_edges(row, pos, level, LEFT, DOWN)
        else:
            canvas.add_edges(row, pos, level, LEFT, RIGHT)

    # Title row
    title_row = top + 1
    canvas.add_edges(title_row, left, level, UP, DOWN)
    canvas.add_edges(title_row, left + width - 1, level, UP, DOWN)
    title_text = title.center(inner_width)
    for idx, ch in enumerate(title_text):
        canvas.set_fill(title_row, left + 1 + idx, ch, level)

    # Divider
    divider_row = top + 2
    if draw_divider:
        for col in range(width):
            pos = left + col
            if col == 0:
                canvas.add_edges(divider_row, pos, level, UP, DOWN, RIGHT)
            elif col == width - 1:
                canvas.add_edges(divider_row, pos, level, UP, DOWN, LEFT)
            else:
                canvas.add_edges(divider_row, pos, level, LEFT, RIGHT)
    else:
        canvas.add_edges(divider_row, left, level, UP, DOWN)
        canvas.add_edges(divider_row, left + width - 1, level, UP, DOWN)

    # Body
    for offset, line in enumerate(body):
        row = top + 3 + offset
        canvas.add_edges(row, left, level, UP, DOWN)
        canvas.add_edges(row, left + width - 1, level, UP, DOWN)
        padded = line.ljust(inner_width)
        for idx, ch in enumerate(padded):
            canvas.set_fill(row, left + 1 + idx, ch, level)

    # Bottom border
    bottom_row = top + height - 1
    for col in range(width):
        pos = left + col
        if col == 0:
            canvas.add_edges(bottom_row, pos, level, UP, RIGHT)
        elif col == width - 1:
            canvas.add_edges(bottom_row, pos, level, UP, LEFT)
        else:
            canvas.add_edges(bottom_row, pos, level, LEFT, RIGHT)


def pad(text: str) -> str:
    return " " * PADDING + text


def pad_with_selector(text: str) -> str:
    return " " + SELECTOR + " " + text


def menu_separator(width: int) -> str:
    inner = max(0, width - (PADDING * 2))
    return " " * PADDING + "─" * inner + " " * PADDING


def main_menu_template() -> BodyTemplate:
    description = "Connect and interact with your Backend Services"
    menu_items = [
        ("Backend Services", "View and manage connected backend services"),
        ("Execute Commands", "Run commands on connected backends"),
        ("System Status", "View system health and configuration"),
        ("Settings", "Configure Templum behavior"),
    ]
    nav_items = ["Back", "Home", "Help", "Exit"]

    preview_lines: List[str] = [
        pad(description),
        "",
        pad_with_selector(f"{menu_items[0][0]} - {menu_items[0][1]}"),
    ]
    preview_lines += [pad(f"{label} - {details}") for label, details in menu_items[1:]]
    preview_lines += ["", *(pad(item) for item in nav_items)]
    min_width = max(len(line) for line in preview_lines) + PADDING

    def render(width: int) -> List[str]:
        width = max(width, min_width)
        lines: List[str] = [
            pad(description),
            "",
            pad_with_selector(f"{menu_items[0][0]} - {menu_items[0][1]}"),
        ]
        for label, details in menu_items[1:]:
            lines.append(pad(f"{label} - {details}"))
        lines.append("")
        lines.append(menu_separator(width))
        for item in nav_items:
            lines.append(pad(item))
        lines.append("")
        return [line.ljust(width) for line in lines]

    return BodyTemplate(min_width=min_width, render=render)


def backend_services_template() -> BodyTemplate:
    description = "Manage connections to a backend service"
    menu_actions = [
        ("Connected Services", "Show all currently connected backend services"),
        ("Refresh Service Discovery", "Scan for new backend services"),
    ]
    services_connected = [("minimal-example", "Healthy")]
    services_disconnected = [
        ("haruspex", "Disconnected (Not available)"),
        ("litany", "Disconnected (Not available)"),
        ("pcl", "Disconnected (Not available)"),
    ]
    nav_items = ["Back", "Home", "Help", "Exit"]

    name_column = 16

    preview_lines = [
        pad(description),
        "",
        pad_with_selector(f"{menu_actions[0][0].ljust(24)}  - {menu_actions[0][1]}"),
    ]
    preview_lines += [pad(f"{label.ljust(24)}  - {details}") for label, details in menu_actions[1:]]
    preview_lines += [pad(f"{name.ljust(name_column)}  {status}") for name, status in services_connected + services_disconnected]
    preview_lines += ["", *(pad(item) for item in nav_items)]
    min_width = max(len(line) for line in preview_lines) + PADDING

    def render(width: int) -> List[str]:
        width = max(width, min_width)
        lines: List[str] = [pad(description), ""]
        for idx, (label, details) in enumerate(menu_actions):
            formatted = f"{label.ljust(24)}  - {details}"
            if idx == 0:
                lines.append(pad_with_selector(formatted))
            else:
                lines.append(pad(formatted))
        for name, status in services_connected + services_disconnected:
            lines.append(pad(f"{name.ljust(name_column)}  {status}"))
        lines.append("")
        lines.append(menu_separator(width))
        for item in nav_items:
            lines.append(pad(item))
        lines.append("")
        return [line.ljust(width) for line in lines]

    return BodyTemplate(min_width=min_width, render=render)


def execute_command_template() -> BodyTemplate:
    description = "Run a minimal-example command"
    outputs = [
        "[0] mock-result: line 1",
        "[1] mock-result: line 2",
        "[2] mock-result: line 3",
    ]
    nav_items = ["Back", "Home", "Help", "Exit"]

    def render(width: int) -> List[str]:
        width = max(width, min_width)
        box_width = max(width - (PADDING * 2) - 2, len("> type a command"))
        lines: List[str] = [pad(description), ""]

        lines.append(
            " " * PADDING + "┌" + "─" * box_width + "┐" + " " * PADDING
        )
        inner = (" " + "> type a command").ljust(box_width)
        lines.append(" " * PADDING + "│" + inner + "│" + " " * PADDING)
        lines.append(
            " " * PADDING + "└" + "─" * box_width + "┘" + " " * PADDING
        )

        for entry in outputs:
            lines.append((" " * (PADDING + 1) + entry).ljust(width))
        lines.extend([""] * 2)
        lines.append(menu_separator(width))
        for item in nav_items:
            lines.append(pad(item))
        lines.append("")
        return [line.ljust(width) for line in lines]

    sample_box_width = len("> type a command")
    preview_lines = [
        pad(description),
        "",
        " " * PADDING + "┌" + "─" * sample_box_width + "┐" + " " * PADDING,
        " " * PADDING + "│" + (" " + "> type a command").ljust(sample_box_width) + "│" + " " * PADDING,
        " " * PADDING + "└" + "─" * sample_box_width + "┘" + " " * PADDING,
    ]
    preview_lines += [(" " * (PADDING + 1) + entry) for entry in outputs]
    preview_lines += [pad(item) for item in nav_items]
    min_width = max(len(line) for line in preview_lines) + PADDING
    return BodyTemplate(min_width=min_width, render=render)


def shell_template() -> BodyTemplate:
    return BodyTemplate(min_width=0, render=lambda width: [])


def build_page_layouts() -> List[PageLayout]:
    main_menu = PageLayout(
        name="Main Menu",
        windows=[
            WindowDefinition(title="Templum", template=main_menu_template()),
        ],
    )

    backend_services = PageLayout(
        name="Backend Services",
        windows=[
            WindowDefinition(title="Templum", template=shell_template(), autopad_children=True),
            WindowDefinition(title="Backend Services", template=backend_services_template()),
        ],
    )

    execute_command = PageLayout(
        name="Execute Command",
        windows=[
            WindowDefinition(title="Templum", template=shell_template(), autopad_children=True),
            WindowDefinition(title="Execute Command", template=shell_template(), autopad_children=True),
            WindowDefinition(title="minimal-example", template=execute_command_template()),
        ],
    )

    return [main_menu, backend_services, execute_command]


def compute_inner_widths(page: PageLayout) -> List[int]:
    levels = len(page.windows)
    inner_widths = [0] * levels
    for idx in reversed(range(levels)):
        definition = page.windows[idx]
        min_width = definition.template.min_width
        title_width = len(definition.title)
        candidate = max(min_width, title_width)
        if idx < levels - 1:
            candidate = max(candidate, inner_widths[idx + 1])
        inner_widths[idx] = candidate
    return inner_widths


def build_bodies(page: PageLayout, inner_widths: List[int]) -> List[List[str]]:
    bodies: List[List[str]] = []
    for idx, definition in enumerate(page.windows):
        width = inner_widths[idx]
        bodies.append(definition.template.render(width))
    # Pad outer windows to make space for children
    for idx in range(len(page.windows) - 2, -1, -1):
        if not page.windows[idx].autopad_children:
            continue
        required_lines = len(bodies[idx + 1])
        deficit = required_lines - len(bodies[idx])
        if deficit > 0:
            bodies[idx].extend([" " * inner_widths[idx]] * deficit)
    return bodies


def render_page(page: PageLayout) -> List[str]:
    inner_widths = compute_inner_widths(page)
    bodies = build_bodies(page, inner_widths)

    specs = []
    max_height = 0
    for level, definition in enumerate(page.windows):
        width = inner_widths[level] + 2
        top = ROW_OFFSET * level
        left = COL_OFFSET * level
        height = 3 + len(bodies[level]) + 1
        specs.append((top, left, width, height, definition.title, bodies[level]))
        max_height = max(max_height, top + height)

    levels = len(page.windows)
    extra_width = COL_OFFSET * (levels - 1)
    if levels > 2:
        extra_width += PADDING
    outer_width = inner_widths[0] + 2 + extra_width
    canvas = Canvas(outer_width, max_height)

    for idx, (top, left, width, _height, title, body) in enumerate(specs):
        draw_window(
            canvas,
            top,
            left,
            width,
            title,
            body,
            draw_divider=(idx == len(specs) - 1),
            level=idx,
        )

    return canvas.render()


def main() -> None:
    pages = build_page_layouts()
    for page in pages:
        print(f"# {page.name}")
        print()
        rendered = render_page(page)
        for line in rendered:
            print(line.rstrip())
        print()
        status = compare_to_target(page.name, rendered)
        print(f"Target comparison: {status}")
        print()


def compare_to_target(page_name: str, rendered: List[str]) -> str:
    target = TARGET_SECTIONS.get(page_name)
    if target is None:
        return "No target available"
    if rendered == target:
        return "OK"
    print("Target comparison: differences detected:")
    max_len = max(len(rendered), len(target))
    for idx in range(max_len):
        gen = rendered[idx] if idx < len(rendered) else ""
        tgt = target[idx] if idx < len(target) else ""
        if gen != tgt:
            print(f"  row {idx:02}: expected {repr(tgt)}, got {repr(gen)}")
    return "Mismatch"


if __name__ == "__main__":
    main()
