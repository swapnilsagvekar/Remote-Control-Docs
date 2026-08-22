# Connect Postman ↔ Cursor

## Install the Postman plugin (required)

In **Cursor chat**, run one of:

```text
/add-plugin postman
```

or (local clone already on this machine):

```text
/add-plugin /home/swapnil/.cursor/plugins/local/cursor-postman-plugin
```

Marketplace: https://cursor.com/marketplace/postman

Then run:

```text
/postman:setup
```

## MCP

`~/.cursor/mcp.json` already has the Postman remote MCP entry. After the plugin installs, reload **Settings → MCP** (or restart Cursor).

Prefer keeping the key in an env var instead of plain text in `mcp.json`:

```bash
# ~/.bashrc
export POSTMAN_API_KEY='PMAK-…'
```

## Sync Trial mobile collection

After setup works, ask the agent:

> Sync Skitii-Docs-Generation/postman/skitii-trial-mobile.postman_collection.json into my Postman workspace
