# mcp servers for local dev (windows + wsl, vscodium)

*scope*: local coding on your machine (windows + wsl + vscodium). prefer no sign‑ups / no vendor lock‑in / no cloud runtimes. allow GitHub access as the only remote. be generous if a tool adds value to generic dev flows (fs, git, testing, security) and can run locally.

> status key — [~] --- likely useful • [~] --- check notes

- [~] [04k] [klavis](https://github.com/Klavis-AI/klavis) - MCP integration layers that let AI agents use thousands of tools reliably.

---

## Meta-MCP

- [~] [011] [1mcpserver](https://github.com/particlefuture/1mcpserver) — MCP-of-MCPs that auto-discovers/configures local servers; great for auditing what ChatGPT can reach. [WSL]
- [~] [022] [MCP Discovery](https://github.com/rust-mcp-stack/mcp-discovery) — CLI to enumerate server tools/resources; good to debug configs.
- [~] [236] [ChatMCP](https://github.com/AI-QL/chat-mcp) — cross‑platform GUI to test & drive MCP servers; runs on Windows.
- [~] [070] [Cursor MCP Installer](https://github.com/matthewdcage/cursor-mcp-installer) — tool to install/configure MCP servers inside Cursor IDE; also usable for VSCodium setups.
- [ ] [536] [mcp-proxy](https://github.com/TBXark/mcp-proxy) — aggregate multiple servers behind one endpoint; tidy setups once your list grows.
- [ ] [02k] [mcp-proxy](https://github.com/sparfenyuk/mcp-proxy) — stdio<->sse bridge; pick the proxy that matches transports you need.
- [ ] [017] [MCP STDIO to Streamable HTTP Adapter](https://github.com/pyroprompts/mcp-stdio-to-streamable-http-adapter) — lets chatgpt (http client) reach stdio mcp servers; useful bridge piece.
- [ ] [014] [mcp-mcp](https://github.com/wojtyniak/mcp-mcp) — discovery/indexing of available mcp tools; nice for auditing capabilities locally.
- [ ] [095] [MCP Create](https://github.com/tesla0225/mcp-create) — start/stop/manage other servers locally on-the-fly; good for ephemeral tooling.
- [ ] [01k] [MCP Installer](https://github.com/anaisbetts/mcp-installer) — installs other mcp servers for you; convenient bootstrapper. [WSL]
- [ ] [009] [MCP Server Generator](https://github.com/SerhatUzbas/mcp-server-generator) — guided creation of js mcp servers; useful if you’ll roll your own glue.
- [ ] [026] [MCP Server Creator](https://github.com/GongRzhe/MCP-Server-Creator) — similar idea, leaning fastmcp/python; pick the ecosystem you prefer.
- [ ] [147] [Nacos MCP Router](https://github.com/nacos-group/nacos-mcp-router) — local registry/router for mcp servers; advanced setups only.

## MCP-tools

- [~] [030] [Mcp-Swagger-Server](https://github.com/zaizaizhao/mcp-swagger-server) — Transforms OpenAPI specifications into MCP tools, enabling AI assistants to interact with REST APIs through standardized protocol.
- [~] [002] [MCPIgnore Filesytem](https://github.com/CyberhavenInc/filesystem-mcpignore) — .mcpignore to keep secrets/.git/keys out of chat reach; highly recommended.
- [~] [008] [MCP Context Provider](https://github.com/doobidoo/MCP-Context-Provider) — persistent tool‑specific context/rules across sessions; useful for consistency. [AI]
- [ ] [298] [interactive-mcp](https://github.com/ttommyth/interactive-mcp) — human-in-the-loop prompts/approvals/popups from inside VS Code; good guardrail for risky actions. Early but works locally.
- [ ] [065] [Multi-Model Advisor](https://github.com/YuChenSSR/multi-ai-advisor-mcp) — orchestrate local ollama models; use if you already run ollama.
- [ ] [005] [Specbridge](https://github.com/TBosak/specbridge) — convert any OpenAPI spec into live MCP tools; great for hitting your own local dev servers’ APIs during testing.
- [ ] [061] [Template MCP Server](https://github.com/mcpdotdirect/template-mcp-server) — TypeScript scaffold for building your own local MCPs (stdio/HTTP); ideal if you want bespoke tools for your workflow.

## Web Read

- [~] [243] [consult7](https://github.com/szeider/consult7) — analyze large codebases/docs with high‑context models; useful for code review. [WSL]
- [~] [011] [Docy](https://github.com/oborchers/mcp-server-docy) — Real-time access to web documentation online; no outdated, broken, rate-limited files/links. Scrapes with crawl4ai.
- [~] [920] [Microsoft Learn](https://github.com/microsoftdocs/mcp) — bring trusted and up-to-date information directly from Microsoft's official documentation. It supports streamable http transport.
- [ ] [050] [scrapling-fetch](https://github.com/cyberchitta/scrapling-fetch-mcp) — Access text content from bot-protected websites. Fetches HTML/markdown from sites with anti-automation measures using Scrapling.
- [ ] [078] [mcp-local-rag](https://github.com/nkapila6/mcp-local-rag) — local embeddings (mediapipe) + duckduckgo fetch; handy RAG for web search, but adds deps. [WSL]
- [ ] [086] [mcp-read-website-fast](https://github.com/just-every/mcp-read-website-fast) — converts web pages → clean markdown for notes/tests; useful for research, not required for local builds.
- [ ] [081] [mcp-screenshot-website-fast](https://github.com/just-every/mcp-screenshot-website-fast) — high-quality full-page screenshots for debugging docs/ui; requires headless browser bits.
- [ ] [452] [Octocode](https://github.com/bgauryy/octocode-mcp) — code research across github/npm; good for discovery; external reads but no account needed.
- [ ] [---] [Fetch](https://github.com/modelcontextprotocol/servers/blob/main/src/fetch) — pull HTML/JSON/MD/plaintext from URLs for docs/samples; no account needed; sandbox outputs.

## Web Access

- [~] [20k] [Playwright](https://github.com/microsoft/playwright-mcp) — browser automation & testing (navigate, screenshot, scrape, repair flows); good for E2E tests. [WSL]
- [~] [023] [BrowserLoop](https://github.com/mattiasw/browserloop) — Playwright screenshots (pages/elements); lightweight. [WSL]
- [ ] [---] [Browser MCP](https://github.com/bytedance/UI-TARS-desktop/tree/main/packages/agent-infra/mcp-servers/browser) — local browser automation via Puppeteer; Node install. [WSL]
- [ ] [740] [browser-use](https://github.com/co-browser/browser-use-mcp-server) — dockerized Playwright + VNC; good for E2E flows. [WSL]
- [ ] [05k] [Playwright](https://github.com/executeautomation/mcp-playwright) — drive a local browser to test flows/scrape docs; useful for ui or e2e checks; adds browser deps.
- [ ] [040] [Puppeteer vision](https://github.com/djannot/puppeteer-vision-mcp) — similar to above with vision assist; choose one (playwright *or* puppeteer) to avoid bloat.
- [ ] [01k] [Operative WebEvalAgent](https://github.com/Operative-Sh/web-eval-agent) — autonomous web app tester; helpful for local webapp debug loops; use with guardrails.

## Context Management

- [~] [015] [code-context-provider-mcp](https://github.com/AB498/code-context-provider-mcp) — fast repo context via WASM Tree-sitter (no native deps); extracts structure/symbols for smarter Q&A. [WSL]
- [~] [010] [Context Crystallizer](https://github.com/hubertciebiada/context-crystallizer) — transforms large repos into structured, AI‑friendly knowledge; good for project onboarding.
- [~] [639] [context-portal](https://github.com/GreatScottyMac/context-portal) — builds project‑specific knowledge graph; RAG backend for local repos.
- [~] [274] [llm-context](https://github.com/cyberchitta/llm-context.py) — “repo packer” to curate/include files by globs/profiles before asking; ideal for tight, reproducible context.
- [ ] [000] [lucene-mcp-server](https://github.com/VivekKumarNeu/MCP-Lucene-Server) — run your own local full-text index over docs/code for fast search; Java/.NET variants exist.
- [ ] [03k] [AntV Chart](https://github.com/antvis/mcp-server-chart) — local chart generation for docs/reporting; Node install. [WSL]
- [~] [090] [ECharts MCP Server](https://github.com/hustcc/mcp-echarts) — chart generation via ECharts; useful alternative to AntV.

## File Search

- [~] [242] [Everything Search](https://github.com/mamertofabian/mcp-everything-search) — integrates Windows Everything search SDK for instant file search; Windows native.
- [~] [015] [mcp-grep](https://github.com/erniebrodeur/mcp-grep) — fast, grep-like code search via mcp; great for scoped, recursive queries in repos. [WSL]
- [~] [01k] [Minima](https://github.com/dmayboroda/minima) — local file RAG on your docs/code; no cloud key required; good for repo Q&A. [WSL]
- [~] [011] [RAG Local](https://github.com/renl/mcp-rag-local) — simple local semantic store for text/code; nice lightweight alternative to heavier rag stacks.
- [ ] [01k] [Language Server](https://github.com/isaacphi/mcp-language-server) — semantic code nav (defs/refs/rename/diagnostics) exposed via MCP; pairs well with files/git. Early but promising.

## File Read

- [~] [100] [eBook-mcp](https://github.com/onebirdrocks/ebook-mcp) — lets AI read local PDFs/EPUBs; ideal for local reading assistants.
- [~] [023] [PDF reader MCP](https://github.com/gpetraroli/mcp_pdf_reader) — read/search local pdfs (api docs, specs) inline; zero cloud.

## File Access

- [~] [---] [Filesystem](https://github.com/modelcontextprotocol/servers/blob/main/src/filesystem) — read/write files, list directories; configurable root + allow/deny patterns; pair with command tool for shell tasks.
- [~] [095] [code-assistant](https://github.com/stippi/code-assistant) — explore a codebase and make edits; use on trusted repos only; good for supervised bulk refactors.
- [~] [012] [Fast Filesystem](https://github.com/efforthye/fast-filesystem-mcp) — precise code search/edits across a repo; great for supervised refactors. [WSL]
- [~] [512] [Golang Filesystem Server](https://github.com/mark3labs/mcp-filesystem-server) — minimal, secure read/write with allow-listed roots and access controls. [WSL]
- [~] [070] [Rust MCP Filesystem](https://github.com/rust-mcp-stack/rust-mcp-filesystem) — fast, read-only-by-default file ops (opt-in writes), globbing, zips; great “do exactly what I say” FS access. [WSL]
- [ ] [167] [filesystem-quarkus](https://github.com/quarkiverse/quarkus-mcp-servers/tree/main/filesystem) — list, read and modify files from the filesystem

## File Conversion

- [~] [---] [Markitdown](https://github.com/Klavis-AI/klavis/tree/main/mcp_servers/markitdown) — convert files → Markdown (uses Microsoft’s `markitdown` under the hood); great for bringing docs into context locally.
- [~] [411] [Pandoc](https://github.com/vivekVells/mcp-pandoc) — local doc conversion (md↔docx/pdf/html) for readmes, specs, release notes; no cloud required.
- [~] [007] [PDF Tools MCP](https://github.com/Sohaib-2/pdf-mcp-server) — manipulate/merge/extract pdfs locally; useful for bundling build docs/reports.
- [ ] [02k] [Markdownify](https://github.com/zcaceres/mcp-markdownify-server) — broad “anything → Markdown” (PDF/images/audio/web). Note: active Windows support + security advisories - pin version and restrict sources.
- [ ] [---] [Markdown2doc](https://github.com/Klavis-AI/klavis/tree/main/mcp_servers/pandoc) — Pandoc-backed MD ↔ doc/pdf conversions; needs Pandoc installed; nice for export pipelines.

## Knowledge

- [~] [02k] [Basic Memory](https://github.com/basicmachines-co/basic-memory) — local‑first Markdown knowledge graph (persistent project memory). [WSL]
- [ ] [054] [PIF](https://github.com/hungryrobot1/MCP-PIF) — local file ops + journaling/structure; can act as a general helper if kept local.

## Code Execution

- [~] [265] [code-sandbox-mcp](https://github.com/Automata-Labs-team/code-sandbox-mcp) — secure code execution inside Docker containers. [WSL]
- [~] [195] [commands](https://github.com/g0t4/mcp-server-commands) — run allow-listed commands/scripts like a terminal; wire to WSL non-privileged user for sandboxing; avoid raw `bash -c`.
- [~] [026] [Shell](https://github.com/sonirico/mcp-shell) — execute allow-listed shell commands with auditability; wire to WSL user for sandboxing; good for scripted build/test flows.
- [ ] [189] [code-executor](https://github.com/bazinga012/mcp_code_executor) — execute Python inside a specified Conda env; constrain packages; Windows native or WSL Conda/Mamba.

## Computer Control

- [~] [038] [computer-control-mcp](https://github.com/AB498/computer-control-mcp) — local mouse/keyboard/OCR automation via PyAutoGUI + OCR libs; Windows supported.
- [~] [009] [kill-process-mcp](https://github.com/misiektoja/kill-process-mcp) — list/terminate local processes via allow-listed tools; useful for stuck dev servers/tests. [WSL]
- [~] [007] [Python CLI MCP](https://github.com/ofek/pycli-mcp) — call local python clis/scripts from chat with allow-lists; perfect for ad-hoc utilities.
- [ ] [05k] [DesktopCommander](https://github.com/wonderwhy-er/DesktopCommanderMCP) — powerful local control (edit files, run terminal, optional SSH); set read-only by default and log actions. [WSL]
- [ ] [001] [SystemSage](https://github.com/Tarusharma1/SystemSage) — local system info/management (processes, services, nets, optional Docker/K8s); powerful, so run read-mostly unless you need control.
- [ ] [005] [persistproc](https://github.com/irskep/persistproc) — manage long-running local processes (dev servers, watchers) from chat; powerful, log actions.
- [ ] [083] [Terminal-Control](https://github.com/GongRzhe/terminal-controller-mcp) — basic local terminal/file ops via MCP; simpler surface than full shell bridges; use tight allow-lists.
- [ ] [005] [APT MCP](https://github.com/GdMacmillan/apt-mcp-server) — exposes Debian `apt` inside WSL; useful for env setup. [WSL]

## Reasoning

- [~] [70k] [Sequential-Thinking](https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking) - dynamic and reflective problem-solving through a structured thinking process.
- [~] [034] [CRASH](https://github.com/nikkoxgonzales/crash-mcp) — structured reasoning server with branching + validation; experimental but interesting for agent workflows.
- [~] [175] [Deep Research](https://github.com/reading-plus-ai/mcp-server-deep-research) — automated research & structured reporting; can run locally; useful for structured exploration.

## Git

- [~] [23k] [Github](https://github.com/github/github-mcp-server) — repo context, issues/PRs, branches; runs locally; auth with PAT (minimal scopes).
- [~] [028] [Git](https://github.com/geropl/git-mcp-go) — interact with your local repo (status/diff/commit/branch, etc.); keep pushes disabled or restricted. [WSL]
- [~] [008] [Local History](https://github.com/xxczaki/local-history-mcp) — surface VS Code/Cursor Local History (list/restore/search); brilliant for “oops I overwrote that” moments.
- [ ] [008] [GitHub GraphQL](https://github.com/QuentinCody/github-graphql-mcp-server) — advanced queries over GH data; great for custom dashboards/reports; needs token.
- [ ] [001] [GitHub Projects](https://github.com/redducklabs/github-projects-mcp) — manage GH Projects (items/fields/milestones) from chat; token required.
- [ ] [011] [GitHub Repos Manager MCP Server](https://github.com/kurdin/github-repos-manager-mcp) — “80+ tools” for GH automation; powerful but noisy—scope carefully; token required.
- [ ] [06k] [GitMCP](https://github.com/idosal/git-mcp) — generic GH access via a remote MCP; fine if you’re okay with a hosted hop; otherwise prefer local GH servers.

## Database

- [~] [01k] [DevDb](https://github.com/damms005/devdb-vscode) — connects to local databases (MySQL/Postgres/SQLite/MSSQL) right inside IDE.
- [~] [007] [CSV Editor](https://github.com/santoshray02/csv-editor) — local CSV processing (40+ ops, GB+ scale) with Pandas; useful for data projects. [WSL]
- [~] [480] [Data Exploration](https://github.com/reading-plus-ai/mcp-server-data-exploration) — CSV exploration + insights; caution: executes arbitrary Python; best run in sandboxed env.
- [~] [186] [MCP-Database-Server](https://github.com/executeautomation/mcp-database-server) — one server that covers sqlite/postgres/sql server read/ops; nice generalist for local db poking.
- [ ] [167] [JDBC-quarkus](https://github.com/quarkiverse/quarkus-mcp-servers/tree/main/jdbc) — query local databases via JDBC (e.g., SQLite/Postgres running on your box); useful for app/debug DB pokes.
- [ ] [009] [OpenLink Generic Java Database Connectivity](https://github.com/OpenLinkSoftware/mcp-jdbc-server) — talk to local dbs via odbc dsn; good if you already use odbc; avoid network dsn creds.
- [ ] [015] [PostgreSQL](https://github.com/ahmedmustahid/postgres-mcp-server) — schema inspect + read-only queries for a local postgres; useful for db-backed repos.
- [ ] [005] [MSSQL-MCP-Node](https://github.com/mihai-dulgheru/mssql-mcp-node) — local microsoft sql server access; only if you already run mssql.
- [ ] [809] [MySQL](https://github.com/benborla/mcp-server-mysql) — local mysql access; only if mysql is in your workflow.
- [ ] [005] [SchemaCrawler](https://github.com/schemacrawler/SchemaCrawler-MCP-Server-Usage) — inspect/query relational DB schemas (local Postgres/MySQL/etc.); good when you need DB introspection without a platform.
- [ ] [006] [SchemaFlow](https://github.com/CryptoRadi/schemaflow-mcp-server) — live Postgres/Supabase schema snapshots for AI IDEs; treat as Postgres-first (works fine against local PG).
- [ ] [185] [MongoDB Lens](https://github.com/furey/mongodb-lens) — full-featured mongodb access (local instance); niche but handy if mongo is already in your stack.
- [ ] [029] [Redis](https://github.com/GongRzhe/REDIS-MCP-Server) — local redis ops; relevant if you cache/queue locally.

## Task Management

- [ ] [016] [Tasks](https://github.com/flesler/mcp-tasks) — lightweight local task manager that lives alongside your code (search/filter across files); handy for project TODO triage without a SaaS.
- [ ] [005] [Todos](https://github.com/tomelliot/todos-mcp) — practical file-backed todo list; simple way to keep action items in-repo (no external accounts).

## Testing/Debugging

- [ ] [048] [GDB](https://github.com/pansila/mcp_server_gdb) — drive GDB via MCP; best targeting WSL/Linux builds; gate with read-only files unless actively debugging.
- [ ] [045] [JMeter](https://github.com/QAInsights/jmeter-mcp-server) — run/inspect JMeter tests from chat; Java required. [WSL]
- [ ] [009] [Locust](https://github.com/QAInsights/locust-mcp-server) — drive Locust load tests from chat. [WSL]
- [ ] [078] [Postman](https://github.com/shannonlal/mcp-postman) — run local postman collections via newman; handy for api tests in ci-ish fashion.
- [ ] [059] [lldb-mcp](https://github.com/stass/lldb-mcp) — same idea for LLDB/LLVM toolchains; Windows supported via LLVM or target via WSL.

## Security

- [~] [556] [Semgrep](https://github.com/semgrep/mcp) — local static analysis for security/bug patterns; run via CLI. [WSL]
- [~] [009] [ADR Analysis](https://github.com/tosin2013/mcp-adr-analysis-server) — analyzes ADRs/codebases for architecture & security checks. [WSL]
- [~] [005] [CVE Intelligence Server](https://github.com/gnlds/mcp-cve-intelligence-server-lite) — vulnerability intelligence (CVE, EPSS risk scores); strong fit for local security workflows.
- [ ] [011] [Pinner MCP](https://github.com/safedep/pinner-mcp) — pin github actions/container bases to exact SHAs; great for supply-chain hardening in ci repos.

## Dependencies

- [~] [---] [SafeDep](https://github.com/safedep/vet/blob/main/docs/mcp.md) — vet dependencies for known risks before installing; runs locally.
- [~] [007] [Pacman](https://github.com/oborchers/mcp-server-pacman) — search pypi/npm/crates/…; good for comparing libs without leaving chat; no accounts.
- [ ] [005] [NPM Plus](https://github.com/shacharsol/js-package-manager-mcp) — analyze npm deps/bundles/security; useful when reviewing js projects; read-only to registries.
- [ ] [006] [vulnicheck](https://github.com/andrasfe/vulnicheck) — Python dependency scanner; checks your local lockfiles against OSV/NVD (no account), ships as a Docker-based MCP; good for quick security passes.

## APIs

- [~] [820] [OpenAPI](https://github.com/snaggle-ai/openapi-mcp-server) - Interact with OpenAPI APIs.
- [~] [073] [OpenAPI AnyApi](https://github.com/baryhuang/mcp-server-any-openapi) - Interact with large OpenAPI docs using built-in semantic search for endpoints. Allows for customizing the MCP server prefix.
- [~] [044] [OpenAPI Schema](https://github.com/hannesj/mcp-openapi-schema) — explore big specs token-efficiently; great when you’re implementing against an api and want structured browsing.
- [~] [052] [OpenAPI Schema Explorer](https://github.com/kadykov/mcp-openapi-schema-explorer) — token-savvy access to local/remote openapi/swagger files; pairs well with codegen/refactors.
- [~] [040] [OpenRPC](https://github.com/shanejonas/openrpc-mpc-server) — inspect/invoke json-rpc apis locally (dev servers, tools) without adding bespoke clients.
- [ ] [004] [TcpSocketMCP](https://github.com/SpaceyKasey/TcpSocketMCP/) — raw TCP sockets for talking to local services/ports; niche but useful for protocol testing; handle with care.

## Obsidian

- [ ] [01k] [Obsidian Markdown Notes](https://github.com/calclavia/mcp-obsidian) — search/read your local obsidian vault (or any md dir); pairs well with design docs.
- [ ] [532] [obsidian-mcp](https://github.com/StevenStavrakis/obsidian-mcp) — alt obsidian server (read/write/organize); pick one obsidian path to avoid collisions.

## Schema/JSON

- [~] [076] [JSON](https://github.com/GongRzhe/JSON-MCP-Server) — local JSON querying/transform ops (arrays/strings/dates); handy for config munging.
- [ ] [013] [JSON](https://github.com/kehvinbehvin/json-mcp-filter) — generate TS types/schemas and shape-filter JSON; good for contract checks.

## Tools

- [~] [121] [Calculator](https://github.com/githejie/mcp-server-calculator) — numeric calc tool; trivial install.
- [~] [176] [Depyler](https://github.com/paiml/depyler/tree/main) — Python‑to‑Rust transpiler with verification; reduces energy consumption; local CLI.
- [~] [083] [PAIML MCP Agent Toolkit](https://github.com/paiml/paiml-mcp-agent-toolkit) — scaffolding/templates + code analysis helpers. [WSL]
- [ ] [012] [it-tools-mcp](https://github.com/wrenchpilot/it-tools-mcp) — grab-bag of 100+ local dev utilities (encoders/decoders, hashing, small net tools); nice Swiss-army add-on.
- [ ] [674] [Jupyter MCP Server](https://github.com/datalayer/jupyter-mcp-server) — control local notebooks (edit/exec/cell mgmt). Great for data wrangling; keep kernels constrained.

## Vision

- [ ] [066] [OpenCV](https://github.com/GongRzhe/opencv-mcp-server) — local cv tooling; heavy deps but nice for image test utilities or quick preprocessing.
- [ ] [001] [ScriptFlow](https://github.com/yanmxa/scriptflow-mcp) — turn repetitive AI interactions into saved, executable scripts; useful for repeatable refactors or release rituals; keep storage local.

## Hardware

- [~] [027] [EDA MCP Server](https://github.com/NellyW8/mcp-EDA) — EDA tooling (Verilog, ASIC flows, GTKWave); niche but strong for hardware dev. [WSL]

## Notes

- if you want a sandboxed shell: pair Filesystem MCP with an allow-listed command tool run under a non-privileged WSL user; avoid raw bash -c.
- for browser testing, you now have three flavors listed (Puppeteer, Playwright+Docker, Playwright screenshots). pick one stack to reduce overhead
- test with MCP Discovery.

- safety defaults:
  - add a minimal “command exec” tool (stdin/stdout only, allowlist of commands like npm run, pytest, ruff, pytest -k, make, git status), sandboxed via WSL non‑privileged user.
  - directory allowlist: single project root; reject .. paths.
  - read‑only by default; require confirmation for write/delete.
  - no raw shell: expose task‑shaped tools, not bash -c.
  - log everything to a dedicated file per session.
