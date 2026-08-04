# Socket Security Visual Studio Code Extension

[![Follow @SocketSecurity](https://img.shields.io/twitter/follow/SocketSecurity?style=social)](https://twitter.com/SocketSecurity)
[![Follow @socket.dev on Bluesky](https://img.shields.io/badge/Follow-@socket.dev-1DA1F2?style=social&logo=bluesky)](https://bsky.app/profile/socket.dev)

This extension provides automatic reporting of security concerns from [Socket Security](https://socket.dev). The features of this extension aim to provide guidance through all stages of development.

## Install

Install **Socket Security** from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=SocketSecurity.vscode-socket-security), or from inside the editor by opening the Extensions view and searching for `Socket Security`.

To build and install from source instead, see [Development](#development) below.

## Usage

Once installed the extension reports on the packages your code imports as you write it. There is nothing to run, because each of the features below activates on its own.

### Ahead of package installation

Package imports in JavaScript and Python are detected and given summary scores to show concerns with configurable overlays. These overlays will persist even after package installation.

Socket detects multiple alternate forms of package imports, including dynamic `import()` or `require` in JavaScript or `importlib.import_module` in Python.

### MCP server

The extension automatically registers the Socket MCP server at <https://mcp.socket.dev> so the public MCP server is available to use.

### Team guide

If you are in charge of a team you may wish to set this up as a recommended extension, or configure it through other organization level settings. Please refer to our docs.

## Development

Install dependencies with `pnpm install`, then use the scripts below.

| Command                       | What it does                              |
| ----------------------------- | ----------------------------------------- |
| `pnpm run build`              | Bundle the extension into `out/`          |
| `pnpm run watch`              | Rebuild on change while developing        |
| `pnpm test`                   | Run the unit tests                        |
| `pnpm run lint`               | Lint and check formatting                 |
| `pnpm run check`              | Run the full check suite                  |
| `pnpm run package-for-vscode` | Produce a `.vsix` you can install locally |

Press <kbd>F5</kbd> in the editor to launch an Extension Development Host with the extension loaded, which is the quickest way to try a change by hand.

## License

[MIT](LICENSE)
