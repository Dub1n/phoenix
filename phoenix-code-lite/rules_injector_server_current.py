"""DSS Rules Injector MCP Server (FastMCP version)
Context-aware DSS rule retrieval system for progressive agent guidance.

Provides tools for intelligent DSS rule loading based on task context.
Works over STDIO (the default transport expected by Cursor / Claude Desktop).
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Annotated, Optional, Union, List, Any

# API imports
from mcp.server.fastmcp import FastMCP
from mcp.types import ToolsCapability, ServerCapabilities, ToolListChangedNotification
import anyio
from mcp.server.stdio import stdio_server
from mcp.server.lowlevel.server import NotificationOptions
from mcp.types import ErrorData, INVALID_PARAMS
from mcp.shared.exceptions import McpError

# Pydantic Field for parameter metadata
from pydantic import Field

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("dss_rules_injector")

# ---------------------------------------------------------------------------
# FastMCP server definition
# ---------------------------------------------------------------------------

# Properly typed tools capability so clients recognize listChanged
capabilities = ServerCapabilities(tools=ToolsCapability(listChanged=True))
# FastMCP instance with explicit capabilities
mcp = FastMCP("dss_rules_injector_server", capabilities=capabilities)

# Advertise that the tool list may change so clients request it immediately
mcp._mcp_server.notification_options.tools_changed = True  # type: ignore[attr-defined]

# Resolve project root (parent of src/ directory where this script lives)
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# DSS Rules base path (relative to project root)
RULES_BASE_PATH = PROJECT_ROOT / ".cursor" / "rules"

# Default bootstrap trilogy for DSS initialization
DEFAULT_BOOTSTRAP_RULES = [
    "00-dss-core.mdc",
    "01-dss-behavior.mdc", 
    "workflows/00-workflow-selection.mdc"
]

# Context-based rule suggestions
CONTEXT_RULE_MAP = {
    "code": ["workflows/02-code-modification.mdc", "guidelines/11-documentation-standards.mdc"],
    "documentation": ["workflows/03-documentation-driven.mdc", "guidelines/07-folder-readme-policy.mdc"],
    "validation": ["guidelines/04-validation-rules.mdc", "guidelines/09-error-recovery.mdc"],
    "tasks": ["workflows/04-task-decomposition.mdc", "guidelines/05-tag-conventions.mdc"],
    "github": ["workflows/06-github-issues-integration.mdc", "guidelines/08-github-issue-labels.mdc"],
    "maintenance": ["guidelines/01-dss-maintenance.mdc", "guidelines/06-backlink-conventions.mdc"],
    "templates": ["guidelines/00-dss-templates.mdc", "guidelines/03-naming-conventions.mdc"]
}

RULES_SENT = False # Track if bootstrap rules have been sent

# ---------------------------------------------------------------------------
# Type Validation and Error Handling
# ---------------------------------------------------------------------------

def validate_rule_files_parameter(rule_files: Any) -> tuple[bool, Optional[List[str]], List[str], Optional[str]]:
    """
    Validate and parse the rule_files parameter with robust error handling.
    
    Args:
        rule_files: The input parameter to validate
        
    Returns:
        Tuple of (is_valid, parsed_value, warnings, error_message)
    """
    logger.info(f"validate_rule_files_parameter: Received rule_files={repr(rule_files)} (type={type(rule_files).__name__})")
    warnings = []
    
    # Handle null/undefined/None
    if rule_files is None:
        return True, None, warnings, None
    
    # Handle actual arrays
    if isinstance(rule_files, list):
        # Validate array contents
        if not all(isinstance(item, str) for item in rule_files):
            error_msg = (
                "Expected array of strings, but received array with non-string items. "
                "Examples: [], ['guidelines/04-validation-rules.mdc']"
            )
            return False, None, warnings, error_msg
        return True, rule_files, warnings, None
    
    # Handle string input with smart parsing
    if isinstance(rule_files, str):
        return parse_string_input(rule_files)
    
    # Handle any other type
    error_msg = (
        f"Expected array of strings or null for rule_files parameter, but received {type(rule_files).__name__}: '{rule_files}'. "
        "Please provide either: [] (empty array), null, or an array of rule file paths like ['guidelines/04-validation-rules.mdc']"
    )
    return False, None, warnings, error_msg

def parse_string_input(input_str: str) -> tuple[bool, Optional[List[str]], List[str], Optional[str]]:
    """
    Parse string input with smart handling for various formats.
    
    Args:
        input_str: String input to parse
        
    Returns:
        Tuple of (is_valid, parsed_value, warnings, error_message)
    """
    warnings = []
    trimmed = input_str.strip()
    
    # Handle empty strings
    if trimmed == "":
        warnings.append("Empty string provided, using null")
        return True, None, warnings, None
    
    # Handle string representation of empty array
    if trimmed == "[]":
        logger.info("parse_string_input: Detected string '[]', treating as request for bootstrap trilogy (null)")
        warnings.append("String '[]' interpreted as empty array, using null (bootstrap trilogy)")
        return True, None, warnings, None
    
    # Handle comma-separated lists
    if "," in trimmed:
        items = [item.strip() for item in trimmed.split(",") if item.strip()]
        warnings.append(f"Parsed comma-separated string into array: [{', '.join(items)}]")
        return True, items, warnings, None
    
    # Handle single file paths
    if "/" in trimmed or ".mdc" in trimmed:
        warnings.append(f"Wrapped single file path in array: ['{trimmed}']")
        return True, [trimmed], warnings, None
    
    # Fallback for completely malformed input
    error_msg = f"Unable to parse string input: '{trimmed}'. Expected comma-separated paths or single file path."
    warnings.append("Falling back to bootstrap trilogy due to malformed input")
    return False, None, warnings, error_msg

def generate_helpful_error_message(received_type: str, received_value: Any) -> str:
    """
    Generate helpful error messages with specific guidance.
    
    Args:
        received_type: The type of the received value
        received_value: The actual value received
        
    Returns:
        Helpful error message with examples
    """
    examples = [
        "[] (empty array for bootstrap trilogy)",
        "null (explicit bootstrap trilogy)",
        '["guidelines/04-validation-rules.mdc"] (specific rules)',
        '["guidelines/04-validation-rules.mdc", "workflows/01-quick-tasks.mdc"] (multiple rules)'
    ]
    
    return (
        f"Invalid rule_files parameter.\n"
        f"Received: {received_type} '{received_value}'\n"
        f"Expected: array of strings or null\n"
        f"Examples: {', '.join(examples)}\n"
        f"Falling back to default bootstrap trilogy..."
    )

@mcp.tool(description="Retrieve DSS rule files with intelligent context-based suggestions for progressive agent guidance.")
def get_dss_rules(
    rule_files: Annotated[
        Optional[Union[List[str], str]],
        Field(
            description="List of DSS rule files to retrieve. Omit, pass [], or null to load the default bootstrap trilogy.",
            json_schema_extra={
                "examples": [
                    {"rule_files": []},
                    {"rule_files": ["guidelines/04-validation-rules.mdc"]},
                    {"rule_files": "guidelines/04-validation-rules.mdc,workflows/01-quick-tasks.mdc"},
                    {"rule_files": "guidelines/04-validation-rules.mdc"}
                ],
                "activation_triggers": [
                    "first user message",
                    "rules missing",
                    "agent bootstrap"
                ]
            },
        ),
    ] = None,
    context: Annotated[str, Field(description="Task context to suggest additional relevant rules: 'code', 'documentation', 'validation', 'tasks', 'github', 'maintenance', 'templates'")] = "",
    include_suggestions: Annotated[bool, Field(description="Whether to include context-based rule suggestions")] = True,
) -> str:
    """Retrieve DSS rule files with context-aware suggestions.

    Args:
        rule_files: Specific rule files to retrieve. Defaults to bootstrap trilogy.
        context: Task context for smart rule suggestions.
        include_suggestions: Whether to include additional context-based suggestions.

    Returns:
        Combined content of requested rule files plus suggestions.
    """
    # Fallback: treat empty list as None (bootstrap trilogy)
    if isinstance(rule_files, list) and len(rule_files) == 0:
        logger.info("get_dss_rules: Received empty list for rule_files, treating as None (bootstrap trilogy fallback)")
        rule_files = None

    # Validate and parse the rule_files parameter
    is_valid, parsed_rule_files, warnings, error_message = validate_rule_files_parameter(rule_files)

    # Build response with warnings and error information
    response_parts = []

    # Add warnings if any
    if warnings:
        response_parts.append("## Warnings\n")
        for warning in warnings:
            response_parts.append(f"- {warning}\n")
        response_parts.append("\n")

    # Add error message if validation failed
    if error_message:
        response_parts.append("## Error\n")
        response_parts.append(f"{error_message}\n\n")

    # Use parsed files or fall back to bootstrap trilogy
    if is_valid and parsed_rule_files is not None:
        # Use the parsed files
        rule_files_to_load = parsed_rule_files
    else:
        # Fall back to bootstrap trilogy
        rule_files_to_load = DEFAULT_BOOTSTRAP_RULES.copy()
        if not is_valid:
            response_parts.append("**Note**: Using default bootstrap trilogy due to parameter validation issues.\n\n")

    # Add context-based suggestions
    suggested_files = []
    if include_suggestions and context:
        context_lower = context.lower()
        for key, suggestions in CONTEXT_RULE_MAP.items():
            if key in context_lower:
                suggested_files.extend(suggestions)
                break

    all_files = rule_files_to_load + suggested_files

    # Debug: log RULES_BASE_PATH and all rule file paths
    logger.info(f"get_dss_rules: RULES_BASE_PATH is {RULES_BASE_PATH}")
    for rule_file in all_files:
        logger.info(f"get_dss_rules: Attempting to load rule file: {RULES_BASE_PATH / rule_file}")

    # Read rule file contents
    rule_contents = []
    missing_files = []

    for rule_file in all_files:
        rule_path = RULES_BASE_PATH / rule_file
        try:
            if rule_path.exists():
                content = rule_path.read_text(encoding='utf-8')
                rule_contents.append(f"## File: {rule_file}\n\n{content}\n")
                logger.info(f"📖 Loaded rule file: {rule_file}")
            else:
                missing_files.append(rule_file)
                logger.warning(f"⚠️ Rule file not found: {rule_file}")
        except Exception as e:
            missing_files.append(f"{rule_file} (error: {e})")
            logger.error(f"❌ Error reading {rule_file}: {e}")

    # Build main response content
    response_parts.append("# DSS Rules Retrieved\n\n")

    if context:
        response_parts.append(f"**Context**: {context}\n")
        if suggested_files:
            response_parts.append(f"**Context-based suggestions included**: {', '.join(suggested_files)}\n")
        response_parts.append("\n")

    if rule_contents:
        response_parts.append("---\n\n")
        response_parts.append("\n---\n\n".join(rule_contents))

    if missing_files:
        response_parts.append(f"\n\n## Missing Files\nThe following files could not be loaded:\n")
        for missing in missing_files:
            response_parts.append(f"- {missing}\n")

    if not rule_contents:
        response_parts.append("No rule files could be loaded. Check that .cursor/rules directory exists.")

    global RULES_SENT
    RULES_SENT = True  # mark that bootstrap rules have been provided
    return "".join(response_parts)

@mcp.tool(description="List all available DSS rule files organized by category for discovery and navigation.")
def list_available_rules(
    category: Annotated[str, Field(description="Rule category to list: 'workflows', 'guidelines', 'config', 'all'")] = "all",
    include_descriptions: Annotated[bool, Field(description="Whether to include file descriptions from frontmatter")] = True,
) -> str:
    """List available DSS rule files by category.

    Args:
        category: Which category of rules to list.
        include_descriptions: Whether to extract and show descriptions.

    Returns:
        Organized listing of available DSS rule files.
    """
    
    if not RULES_BASE_PATH.exists():
        return "❌ DSS rules directory (.cursor/rules) not found."
    
    def get_file_description(file_path: Path) -> str:
        """Extract description from file frontmatter."""
        try:
            content = file_path.read_text(encoding='utf-8')
            lines = content.split('\n')
            
            # Look for description in YAML frontmatter
            in_frontmatter = False
            for line in lines:
                if line.strip() == '---':
                    if in_frontmatter:
                        break
                    in_frontmatter = True
                    continue
                
                if in_frontmatter and line.startswith('description:'):
                    return line.replace('description:', '').strip()
            
            # Fallback: look for first heading
            for line in lines:
                if line.startswith('# '):
                    return line.replace('# ', '').strip()
                    
        except Exception:
            pass
        return "No description available"
    
    categories_to_check = []
    if category == "all":
        categories_to_check = [".", "workflows", "guidelines", "config"]
    else:
        categories_to_check = [category]
    
    response = "# Available DSS Rules\n\n"
    
    for cat in categories_to_check:
        cat_path = RULES_BASE_PATH / cat if cat != "." else RULES_BASE_PATH
        
        if not cat_path.exists():
            continue
            
        # Get .mdc files in this category
        if cat == ".":
            files = [f for f in cat_path.glob("*.mdc") if not f.name.startswith('.')]
            cat_name = "Core Rules"
        else:
            files = list(cat_path.glob("*.mdc"))
            cat_name = cat.title()
        
        if files:
            response += f"## {cat_name}\n\n"
            
            for file_path in sorted(files):
                relative_path = file_path.relative_to(RULES_BASE_PATH)
                
                if include_descriptions:
                    desc = get_file_description(file_path)
                    response += f"- **{relative_path}** - {desc}\n"
                else:
                    response += f"- {relative_path}\n"
            
            response += "\n"
    
    # Add usage suggestions
    response += "## Usage Suggestions\n\n"
    response += "**Bootstrap**: Start with `get_dss_rules()` (default) to load core rules\n"
    response += "**Context-aware**: Use context parameter for smart suggestions:\n"
    for context_key, suggestions in CONTEXT_RULE_MAP.items():
        response += f"- `{context_key}` → {', '.join(suggestions[:2])}...\n"
    
    return response


async def _run() -> None:
    """Main async entry – launches reminder and MCP stdio server concurrently."""

    logger.info("🚀 Starting DSS Rules Injector (FastMCP / stdio)")

    async def _reminder() -> None:
        """Warn if bootstrap rules haven't been requested shortly after start."""
        await anyio.sleep(5)
        if not RULES_SENT:
            logger.warning(
                "⚠️  No get_dss_rules call detected within 5 seconds of server start. "
                "Agents should invoke get_dss_rules() to load bootstrap rules."
            )

    async def _run_mcp_server() -> None:
        """Run the FastMCP stdio server until EOF."""
        # DEBUG: list registered tools so we can verify the server is exposing them
        try:
            tool_names = list(mcp._mcp_server._tool_registry.keys())  # type: ignore[attr-defined]
            logger.debug("Registered tools at startup: %s", tool_names)
        except AttributeError:
            logger.debug("Could not access tool registry for debug logging.")

        init_opts = mcp._mcp_server.create_initialization_options(
            notification_options=NotificationOptions(tools_changed=True)
        )

        async with stdio_server() as (r, w):
            await mcp._mcp_server.run(r, w, init_opts)

    # Use a nursery so both tasks can run concurrently without TaskGroup state errors
    async with anyio.create_task_group() as tg:
        tg.start_soon(_reminder)
        tg.start_soon(_run_mcp_server)


def main() -> None:  # pragma: no cover
    anyio.run(_run)


# ---------------------------------------------------------------------------
# Entrypoint guard
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    main() 