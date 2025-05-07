import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { registerActions } from "./actions"

async function main() {
  const server = new McpServer({
    name: "JLP Delta Hedger",
    version: "1.0.0"
  })

  registerActions(server)

  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main()
