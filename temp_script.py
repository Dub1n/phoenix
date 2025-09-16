from pathlib import Path
import re

path = Path(r"scripts/validation/src/validators/quality-validator.js")
text = path.read_text()

helper_code = """const DEFAULT_SCOPE_PATTERNS = ['**/*.ts', '**/*.js'];\n\nconst createScopeHandler = async (projectInfo, scopeConfig = {}) => {\n  const hasScopePatterns = scopeConfig and isinstance(scopeConfig.get('patterns', None), list) and len(scopeConfig['patterns']) > 0\n"""
