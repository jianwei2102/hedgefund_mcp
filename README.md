# HedgeGuard: Your AI-Powered Portfolio Guardian

HedgeGuard is an AI-powered bot manager designed to help users protect their crypto portfolio by creating and managing delta-neutral hedging strategies on the Solana blockchain, primarily interacting with the Drift Protocol. It leverages the Model Context Protocol (MCP) to allow users to interact with the bot using natural language queries via Claude Desktop.

**Pitch Video:** [Link to your pitch video will go here]
**Twitter:** [Link to your Twitter page will go here]

## What it Does

HedgeGuard provides a suite of tools to:

- Monitor your cryptocurrency portfolio on Drift.
- Analyze your positions, particularly JLP (Jupiter LP token).
- Calculate ideal delta-neutral hedging positions.
- Automatically execute trades to establish and maintain these hedges.
- Provide real-time updates and activity logs via Telegram.
- Allow for the creation and management of automated hedging bots that rebalance based on predefined conditions.

## How to Install

Follow these steps to set up HedgeGuard:

1.  **Clone the Repository:**

    ```bash
    git clone https://github.com/jianwei2102/hedgefund_mcp.git
    cd hedgefund_mcp
    ```

2.  **Install Dependencies and Build:**

    ```bash
    npm install
    npm run build
    ```

    This will compile the TypeScript code into JavaScript, with the main output being in the `build/` directory.

3.  **Configure Claude Desktop:**

    - Open Claude Desktop.
    - Go to Developer Config Settings (usually found under a settings or developer menu).
    - Open the `claude_desktop_config.json` file.
    - Add the following configuration to the `mcpServers` object:

    ```json
    {
      "mcpServers": {
        "HedgeGuard MCP service": {
          "type": "stdio",
          "command": "node",
          "args": [
            "<Your absolute file location for the build/index.js file location>"
          ],
          "env": {
            "WALLET_PRIVATE_KEY": "<Your Solana wallet private key that will interact with the Drift SDK>",
            "SOLANA_RPC_URL": "<Your Helius RPC URL or another Solana RPC URL>",
            "TELEGRAM_BOT_TOKEN": "<Optional: Your Telegram Bot Token>",
            "CHANNEL_CHAT_ID": "<Optional: Your Telegram Channel ID for notifications>"
          }
        }
      }
    }
    ```

    **Important:**

    - Replace `<Your absolute file location for the build/index.js file location>` with the actual absolute path to the `build/index.js` file in your cloned repository (e.g., `/Users/yourname/dev/hedgefund_mcp/build/index.js`).
    - Fill in your `WALLET_PRIVATE_KEY` and `SOLANA_RPC_URL`.
    - The `TELEGRAM_BOT_TOKEN` and `CHANNEL_CHAT_ID` are optional. If you wish to use Telegram notifications:
      - Create a new bot on Telegram by talking to `@BotFather`. It will give you a token.
      - Add your new bot to a Telegram channel or group.
      - To get the `CHANNEL_CHAT_ID`, add `@JsonDumpBot` to your channel, send a message, and it will reply with the chat details including the ID (it might be a negative number).

4.  **Restart Claude Desktop:**
    - Force close your Claude Desktop application and restart it. This ensures that the new MCP server configuration is loaded.

## How to Use

Once HedgeGuard is installed and configured with Claude Desktop, you can interact with it using natural language prompts. The MCP server exposes several tools that Claude can utilize:

- **`listBots`**:

  - **Description:** List all existing hedging bots that have been created.
  - **Usage:** "List all my bots"

- **`createNewBot`**:

  - **Description:** Create a new Hedging bot. This bot will monitor a specified token position (e.g., JLP), calculate the ideal perpetual contract positions to hedge it, and execute the necessary trades.
  - **Parameters:**
    - `type`: (Enum: "JLP", "TRUMP") - The type of bot to create.
    - `intervalHours`: (Number, min: 1, max: 24, default: 1) - The interval in hours between bot execution runs.
    - `minRebalanceThreshold`: (Number, min: 0, max: 1, default: 0.05) - The minimum percentage change required to trigger a rebalance.
  - **Usage:** "Create a new JLP hedging bot that checks every 2 hours with a 10% rebalance threshold."

- **`getAccountPortfolio`**:

  - **Description:** Get your complete account portfolio from Drift, including spot and perpetual positions.
  - **Usage:** "Show me my current Drift portfolio."

- **`getJlpPosition`**:

  - **Description:** Specifically retrieve your JLP (Jupiter LP token) position from Drift.
  - **Usage:** "What's my current JLP position?"

- **`getPerpsPositions`**:

  - **Description:** Get all your current perpetual contract positions from Drift.
  - **Usage:** "List my perpetual positions."

- **`calculateIdealDeltaNeutralHedge`**:

  - **Description:** Calculate the ideal delta-neutral hedge positions based on your current JLP holdings. The JLP token is assumed to be composed of approximately 47% SOL, 8% ETH, and 13% BTC. The tool calculates the corresponding short positions needed in SOL, ETH, and BTC perpetuals to neutralize the delta of the JLP.
  - **Usage:** "Calculate the ideal hedge for my JLP." or "What perps do I need to short to hedge my JLP?"

- **`sendTGMessage`**:
  - **Description:** Send a predefined test message to your configured Telegram channel. Useful for testing the Telegram integration.
  - **Usage:** "Send a test message to Telegram."

You can use these tools by phrasing your requests naturally in Claude Desktop. For example:
"Hey HedgeGuard, create a new JLP hedging bot."
"Can you show me my current portfolio on Drift?"
"What's the ideal hedge for my JLP right now?"

## License

[MIT]
