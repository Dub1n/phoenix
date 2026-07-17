import sys, json, logging, anyio
from pathlib import Path

from mcp.client.stdio import stdio_client, StdioServerParameters
from mcp.client.session import ClientSession

logging.basicConfig(level=logging.DEBUG)

async def main():
    # Launch via absolute file path to avoid PYTHONPATH issues on Windows
    server_py = Path(__file__).parents[1] / "src" / "rules_injector_server.py"
    server = StdioServerParameters(
        command=sys.executable,
        args=[str(server_py)],
    )
    async with stdio_client(server) as (r, w):
        async with ClientSession(r, w) as session:
            init = await session.initialize()
            print("Tools capability:", init.capabilities.tools)
            tools_result = await session.list_tools()
            print(json.dumps([t.name for t in tools_result.tools], indent=2))

if __name__ == "__main__":
    anyio.run(main) 