# Phase 3: MCP Server & Universal Skin Provider Implementation

## High-Level Goal

Implement the core Litany MCP server as a backend service with Universal Skin Provider for Templum integration, PCL infrastructure component reuse, and optimized metadata management to achieve the target 60-80% token reduction.

## Detailed Context and Rationale

### Why This Phase Exists

With Templum-integrated requirements and backend service architecture designed in Phase 2, this phase implements the dual-purpose MCP server and Universal Skin Provider. This transforms Litany from a concept into a functional backend service that integrates seamlessly with Templum's interface management while reusing proven PCL infrastructure patterns.

### Technical Justification

The backend service approach enables both MCP-based dynamic information retrieval and Templum integration through Universal Skin definitions. By implementing with TypeScript for ecosystem consistency and reusing PCL infrastructure components, we achieve token efficiency while leveraging proven reliability patterns and reducing implementation complexity.

### Architecture Integration

This phase implements the backend service components defined in Phase 2:

- TypeScript MCP server with three optimized tools
- Universal Skin Provider implementing Templum BackendService interface
- PCL infrastructure component extensions (SessionManager, ConfigManager, AuditLogger)
- Hybrid metadata management coordinated with Templum state
- Intelligent caching with cross-interface invalidation
- PCL SkinMenuRenderer integration for CLI compatibility

## Prerequisites & Verification

### Prerequisites from Phase 2

- Backend service requirements specification with Templum integration
- Templum-integrated architecture design with MCP tool definitions
- Universal Skin Provider specification for cross-interface support
- PCL infrastructure reuse patterns documented
- Metadata management strategy with Templum state coordination
- Token reduction strategy validated through backend service approach

### Recommendations from Phase 2 Implementation

[This section will be populated with actual recommendations from Phase 2 implementation]

### Validation Commands

```bash
# Verify architecture documents exist
test -f "DSS/dev/01-Architecture-Foundation.md" && echo "Architecture Foundation found"

# Check TypeScript/Node.js environment for MCP
npm list @modelcontextprotocol/sdk && echo "MCP SDK available"

# Verify PCL infrastructure components
test -d "phoenix-code-lite/src/core" && echo "PCL core components available"

# Check Templum integration readiness
npm list templum-core || echo "Templum integration components needed"
```

### Expected Results

- Templum-integrated architecture foundation document exists
- TypeScript MCP SDK is installed and available
- PCL infrastructure components accessible for reuse
- Development environment configured for TypeScript/Node.js

## Step-by-Step Implementation Guide

### 1. Test-Driven Development (TDD) First - Backend Service & Templum Integration Tests

**Test Name**: "Phase 3 Litany Backend Service & Universal Skin Provider"

Create comprehensive tests for backend service and Templum integration:

```typescript
// tests/litany-backend-service.test.ts
import { LitanyBackendService } from '../src/backend-service';
import { LitanySessionManager } from '../src/session/litany-session-manager';
import { MetadataManager } from '../src/metadata/metadata-manager';
import { UniversalSkinDefinition } from '../src/types/templum-integration';
import { PCLSessionManager, PCLConfigurationManager } from 'phoenix-code-lite';

describe('Litany Backend Service Tests', () => {
    let backendService: LitanyBackendService;
    let sessionManager: LitanySessionManager;
    let metadataManager: MetadataManager;

    beforeEach(async () => {
        backendService = new LitanyBackendService();
        sessionManager = new LitanySessionManager();
        metadataManager = new MetadataManager();
        await backendService.initialize();
    });

    describe('MCP Server Functionality', () => {
        test('getContextualInfo returns relevant content with token efficiency', async () => {
            const result = await backendService.handleCommand('getContextualInfo', {
                query_context: 'code_modification',
                content_types: ['workflow', 'validation'],
                max_tokens: 2000
            });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
            expect(result.files.length).toBeLessThanOrEqual(3);
            
            // Verify token efficiency target
            const tokenCount = countTokens(result.content);
            expect(tokenCount).toBeLessThan(2000);
            expect(tokenCount).toBeGreaterThan(100); // Should have meaningful content
        });

        test('listContexts provides metadata-filtered results', async () => {
            const result = await backendService.handleCommand('listContexts', {
                category_filter: 'workflow',
                show_metadata: true
            });

            expect(result.contexts).toBeDefined();
            expect(result.contexts.every(ctx => 
                ctx.metadata.tags.includes('workflow')
            )).toBe(true);
        });

        test('updateMetadata performs algorithmic updates without LLM', async () => {
            const updateResult = await backendService.handleCommand('updateMetadata', {
                file_path: 'test-workflow.md',
                metadata_updates: { usage_count: 5, last_accessed: new Date().toISOString() },
                recalculate_relevance: true
            });

            expect(updateResult.success).toBe(true);
            expect(updateResult.updated_fields).toContain('usage_count');
        });
    });

    describe('Universal Skin Provider', () => {
        test('provideSkin generates valid Templum-compatible skin', () => {
            const skin: UniversalSkinDefinition = backendService.provideSkin();

            expect(skin.metadata.id).toBe('litany-context-manager');
            expect(skin.metadata.compatibleInterfaces).toContain('vscode');
            expect(skin.metadata.compatibleInterfaces).toContain('cli');
            expect(skin.metadata.compatibleInterfaces).toContain('command');

            // Verify interface definitions exist
            expect(skin.views.treeViews).toBeDefined();
            expect(skin.menus.main).toBeDefined();
            expect(skin.commands['litany:getInfo']).toBeDefined();
        });

        test('skin definition includes PCL SkinMenuRenderer compatibility', () => {
            const skin = backendService.provideSkin();
            
            expect(skin.menus.main.items).toBeDefined();
            expect(skin.menus.main.theme).toBeDefined();
            
            // Verify PCL menu structure compatibility
            skin.menus.main.items.forEach(item => {
                expect(item.id).toBeDefined();
                expect(item.label).toBeDefined();
                expect(item.action).toBeDefined();
            });
        });
    });

    describe('PCL Infrastructure Integration', () => {
        test('LitanySessionManager extends PCL SessionManager', () => {
            expect(sessionManager).toBeInstanceOf(PCLSessionManager);
            expect(sessionManager.syncWithTemplum).toBeDefined();
        });

        test('configuration integrates with PCL system', async () => {
            const config = await sessionManager.loadLitanyConfig();
            
            expect(config.litany).toBeDefined();
            expect(config.litany.mcp_server).toBeDefined();
            expect(config.litany.templum_integration).toBeDefined();
            
            // Verify extends PCL configuration
            expect(config.session).toBeDefined(); // From PCL
            expect(config.audit).toBeDefined(); // From PCL
        });

        test('caching coordinates with Templum state management', async () => {
            const templumState = { interface: 'vscode', sessionId: 'test-123' };
            await sessionManager.syncWithTemplum(templumState);
            
            // Test cache invalidation across interfaces
            const result1 = await backendService.handleCommand('getContextualInfo', {
                query_context: 'test_context'
            });
            
            // Simulate Templum state change
            await sessionManager.syncWithTemplum({ ...templumState, interface: 'cli' });
            
            const result2 = await backendService.handleCommand('getContextualInfo', {
                query_context: 'test_context'
            });
            
            expect(result1.cache_info.hit).toBe(false);
            expect(result2.cache_info.coordinated_sync).toBe(true);
        });
    });

    describe('Performance & Token Efficiency', () => {
        test('cache hit performance meets sub-50ms target', async () => {
            // Prime cache
            await backendService.handleCommand('getContextualInfo', {
                query_context: 'performance_test'
            });
            
            // Measure cache hit
            const start = performance.now();
            await backendService.handleCommand('getContextualInfo', {
                query_context: 'performance_test'
            });
            const duration = performance.now() - start;
            
            expect(duration).toBeLessThan(50); // 50ms target
        });

        test('token reduction achieves 60-80% target vs baseline', async () => {
            const baselineTokens = 5000; // Simulated DSS baseline
            
            const result = await backendService.handleCommand('getContextualInfo', {
                query_context: 'complex_workflow',
                max_tokens: 2000
            });
            
            const actualTokens = countTokens(result.content);
            const reduction = (baselineTokens - actualTokens) / baselineTokens;
            
            expect(reduction).toBeGreaterThanOrEqual(0.6); // 60% minimum
            expect(reduction).toBeLessThanOrEqual(0.8); // 80% maximum
        });
    });
});

function countTokens(content: string): number {
    // Simplified token counting - replace with actual implementation
    return Math.ceil(content.length / 4);
}
```

### 2. Implement Core MCP Server

Create the optimized Litany MCP server:

```python
# litany/server.py
from mcp.server.fastmcp import FastMCP
from mcp.types import ToolsCapability, ServerCapabilities
from typing import Optional, List, Dict, Any
from pydantic import Field
from pathlib import Path
import json
import hashlib
from datetime import datetime, timedelta

class LitanyMCPServer:
    def __init__(self, rules_path: Path = Path("litany/rules")):
        self.rules_path = rules_path
        self.metadata_manager = MetadataManager(rules_path)
        self.cache = CacheManager(ttl_minutes=5)
        
        # Initialize FastMCP with optimized capabilities
        capabilities = ServerCapabilities(
            tools=ToolsCapability(listChanged=True)
        )
        self.mcp = FastMCP("litany_server", capabilities=capabilities)
        
        # Register optimized tools
        self._register_tools()
    
    def _register_tools(self):
        """Register MCP tools with optimized definitions"""
        
        @self.mcp.tool(
            description="Retrieve context-specific information with minimal tokens"
        )
        def get_contextual_info(
            context: str = Field(description="Task context (e.g., 'code', 'documentation')"),
            tags: Optional[List[str]] = Field(default=None, description="Filter tags"),
            limit: int = Field(default=5, description="Maximum files to return")
        ) -> str:
            """Optimized contextual information retrieval"""
            
            # Check cache first
            cache_key = self._generate_cache_key(context, tags, limit)
            cached = self.cache.get(cache_key)
            if cached:
                return cached
            
            # Select files based on metadata
            files = self.metadata_manager.select_files(
                when_to_call=context,
                tags=tags,
                limit=limit
            )
            
            # Build optimized response
            response = self._build_response(files, context)
            
            # Cache the response
            self.cache.set(cache_key, response)
            
            # Update usage statistics algorithmically
            self._update_usage_stats(files)
            
            return response
        
        @self.mcp.tool(
            description="List available information contexts"
        )
        def list_available_contexts(
            category: Optional[str] = Field(default=None, description="Category filter")
        ) -> str:
            """List available contexts with metadata"""
            
            contexts = self.metadata_manager.list_contexts(category)
            
            return json.dumps({
                "contexts": contexts,
                "categories": self.metadata_manager.get_categories()
            }, indent=2)
        
        @self.mcp.tool(
            description="Update file metadata algorithmically"
        )
        def update_metadata(
            file_id: str = Field(description="File identifier"),
            metadata: Dict[str, Any] = Field(description="Metadata updates")
        ) -> str:
            """Update metadata without LLM involvement"""
            
            success = self.metadata_manager.update_metadata(file_id, metadata)
            
            if success:
                # Trigger re-indexing if needed
                self._reindex_if_needed(file_id)
                return f"Metadata updated for {file_id}"
            else:
                return f"Failed to update metadata for {file_id}"
    
    def _build_response(self, files: List[Any], context: str) -> str:
        """Build optimized response with minimal tokens"""
        sections = []
        
        # Add context header
        sections.append(f"# Context: {context}\n")
        
        # Add relevant files with concise formatting
        for file in files:
            # Include only essential content
            sections.append(f"## {file.name}\n")
            sections.append(file.get_relevant_content(context))
            sections.append("\n---\n")
        
        # Add navigation hints if applicable
        if len(files) > 1:
            sections.append(self._generate_navigation_hints(files))
        
        return "\n".join(sections)
    
    def _generate_cache_key(self, context: str, tags: List[str], limit: int) -> str:
        """Generate cache key for request"""
        key_parts = [context, str(sorted(tags or [])), str(limit)]
        key_string = "|".join(key_parts)
        return hashlib.md5(key_string.encode()).hexdigest()
    
    def _update_usage_stats(self, files: List[Any]):
        """Update usage statistics algorithmically"""
        for file in files:
            self.metadata_manager.increment_usage(file.id)
            self.metadata_manager.update_last_accessed(file.id)
```

### 3. Implement Metadata Management

Create the hybrid metadata management system:

```python
# litany/metadata.py
import yaml
import json
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime

class MetadataManager:
    def __init__(self, rules_path: Path):
        self.rules_path = rules_path
        self.metadata_file = rules_path / "litany_metadata.json"
        self.metadata_cache = {}
        self._load_metadata()
    
    def _load_metadata(self):
        """Load external metadata and merge with in-file metadata"""
        # Load external metadata
        if self.metadata_file.exists():
            with open(self.metadata_file, 'r') as f:
                external = json.load(f)
        else:
            external = {}
        
        # Scan files for in-file metadata
        for file_path in self.rules_path.glob("**/*.md"):
            file_id = self._get_file_id(file_path)
            
            # Extract frontmatter
            frontmatter = self._extract_frontmatter(file_path)
            
            # Merge with external metadata
            self.metadata_cache[file_id] = {
                **external.get(file_id, {}),
                **frontmatter,
                "file_path": str(file_path),
                "file_id": file_id
            }
    
    def _extract_frontmatter(self, file_path: Path) -> Dict[str, Any]:
        """Extract YAML frontmatter from file"""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if content.startswith('---'):
            try:
                end_marker = content.index('---', 3)
                yaml_content = content[3:end_marker]
                return yaml.safe_load(yaml_content) or {}
            except (ValueError, yaml.YAMLError):
                return {}
        
        return {}
    
    def select_files(self, 
                    when_to_call: Optional[str] = None,
                    tags: Optional[List[str]] = None,
                    limit: int = 5) -> List[Any]:
        """Select files based on metadata criteria"""
        matches = []
        
        for file_id, metadata in self.metadata_cache.items():
            # Check when_to_call
            if when_to_call and when_to_call not in metadata.get("when_to_call", []):
                continue
            
            # Check tags
            if tags:
                file_tags = metadata.get("tags", [])
                if not any(tag in file_tags for tag in tags):
                    continue
            
            # Calculate relevance score
            score = self._calculate_relevance(metadata, when_to_call, tags)
            matches.append((score, file_id, metadata))
        
        # Sort by relevance and apply limit
        matches.sort(key=lambda x: x[0], reverse=True)
        
        return [
            FileReference(m[1], m[2]) 
            for m in matches[:limit]
        ]
    
    def _calculate_relevance(self, metadata: Dict, context: str, tags: List[str]) -> float:
        """Calculate relevance score for file selection"""
        score = 0.0
        
        # Context match weight
        if context in metadata.get("when_to_call", []):
            score += 1.0
        
        # Tag match weight
        if tags:
            file_tags = metadata.get("tags", [])
            tag_matches = sum(1 for tag in tags if tag in file_tags)
            score += tag_matches * 0.5
        
        # Recency weight
        last_accessed = metadata.get("last_accessed")
        if last_accessed:
            days_ago = (datetime.now() - datetime.fromisoformat(last_accessed)).days
            score += max(0, 1.0 - (days_ago / 30))  # Decay over 30 days
        
        # Usage frequency weight
        usage_count = metadata.get("usage_count", 0)
        score += min(usage_count * 0.1, 1.0)  # Cap at 1.0
        
        return score
```

### 4. Implement Caching Layer

Create efficient caching mechanism:

```python
# litany/cache.py
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import json

class CacheManager:
    def __init__(self, ttl_minutes: int = 5):
        self.cache: Dict[str, CacheEntry] = {}
        self.ttl = timedelta(minutes=ttl_minutes)
        self.hits = 0
        self.misses = 0
    
    def get(self, key: str) -> Optional[str]:
        """Get cached value if not expired"""
        if key in self.cache:
            entry = self.cache[key]
            if datetime.now() < entry.expiry:
                self.hits += 1
                entry.access_count += 1
                return entry.value
            else:
                # Expired, remove it
                del self.cache[key]
        
        self.misses += 1
        return None
    
    def set(self, key: str, value: str):
        """Cache a value with TTL"""
        self.cache[key] = CacheEntry(
            value=value,
            expiry=datetime.now() + self.ttl,
            access_count=0
        )
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total_requests = self.hits + self.misses
        hit_rate = self.hits / total_requests if total_requests > 0 else 0
        
        return {
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": hit_rate,
            "cache_size": len(self.cache),
            "total_requests": total_requests
        }

class CacheEntry:
    def __init__(self, value: str, expiry: datetime, access_count: int = 0):
        self.value = value
        self.expiry = expiry
        self.access_count = access_count
```

### 5. Create Server Runner

Implement the server runner with STDIO transport:

```python
# litany/run_server.py
import anyio
from mcp.server.stdio import stdio_server
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("litany")

async def run_litany_server():
    """Run Litany MCP server over STDIO"""
    server = LitanyMCPServer()
    
    logger.info("Starting Litany MCP Server")
    
    async with stdio_server() as (reader, writer):
        await server.mcp._mcp_server.run(reader, writer)

def main():
    anyio.run(run_litany_server)

if __name__ == "__main__":
    main()
```

### 6. Validation & Testing

Run comprehensive server validation:

```bash
# Run server tests
python -m pytest tests/test_litany_server.py -v

# Test server startup
python litany/run_server.py &
SERVER_PID=$!
sleep 2
kill $SERVER_PID

# Benchmark token usage
python benchmarks/token_benchmark.py

# Validate caching performance
python tests/test_cache_performance.py
```

## Implementation Documentation & Phase Transition (2 parts - both required for completion)

- [ ] **Part A**: Document implementation lessons learned in current phase
  - Create comprehensive "Implementation Notes & Lessons Learned" section with:
    - **Implementation Challenges**: FastMCP integration complexities, metadata extraction issues
    - **Tool/Framework Issues**: MCP SDK version compatibility, Python async handling
    - **Performance Considerations**: Cache sizing, TTL optimization, relevance scoring tuning
    - **Testing Strategy Results**: Server testing approach, mock client creation
    - **Security/Quality Findings**: Input validation requirements, error handling patterns
    - **User Experience Insights**: Tool parameter design, response formatting
    - **Additional Discoveries**: Unexpected performance gains, optimization opportunities
    - **Recommendations for Phase 4**: Integration priorities, interface design considerations

- [ ] **Part B**: Transfer recommendations to next phase document
  - **Target File**: `05-Phase-04-Integration-Architecture.md`
  - **Location**: After Prerequisites section  
  - **Acceptance Criteria**: Phase 4 document contains all recommendation categories from Phase 3
  - **Validation Method**: Read Phase 4 file to confirm recommendations are present

## Success Criteria

Successfully implementing a functional Litany MCP server that achieves the target token reduction while providing efficient, cached, and intelligently filtered information retrieval.

## Definition of Done

• **MCP Server Implemented** - Core server with three tools functioning correctly
• **Metadata Management Working** - Hybrid system extracting and managing metadata
• **Caching Layer Operational** - 5-minute TTL cache reducing response times by >50%
• **Token Reduction Achieved** - Measured 60-80% reduction vs DSS baseline
• **Algorithmic Updates Working** - Metadata updates without LLM involvement
• **All Tests Passing** - 100% test coverage on core functionality
• **Performance Benchmarks Met** - Response time <200ms for cached requests
• **Cross-Phase Knowledge Transfer**: Phase-04 document contains recommendations from Phase-03 implementation
• **Validation Required**: Read Phase 04 document to confirm recommendations transferred successfully  
• **File Dependencies**: Both Phase 03 and Phase 04 documents modified
• **Implementation Documentation Complete**: Current phase contains comprehensive lessons learned section
