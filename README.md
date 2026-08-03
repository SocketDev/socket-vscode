# Socket Security Visual Studio Code Extension

[![Follow @SocketSecurity](https://img.shields.io/twitter/follow/SocketSecurity?style=social)](https://twitter.com/SocketSecurity)
[![Follow @socket.dev on Bluesky](https://img.shields.io/badge/Follow-@socket.dev-1DA1F2?style=social&logo=bluesky)](https://bsky.app/profile/socket.dev)

This extension provides automatic reporting of security concerns from [Socket Security](https://socket.dev). The features of this extension aim to provide guidance through all stages of development.

## Install

Install from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=SocketSecurity.vscode-socket-security), or from the command line:

```shell
code --install-extension SocketSecurity.vscode-socket-security
```

## Usage

The extension works ahead of package installation:

- Package imports in JavaScript and Python are detected and given summary scores to show concerns with configurable overlays. These overlays will persist even after package installation.
- Socket detects multiple alternate forms of package imports, including dynamic `import()` or `require` in JavaScript or `importlib.import_module` in Python.
- The extension automatically registers the Socket MCP server at <https://mcp.socket.dev> to allow usage of the public MCP server.

If you are in charge of a team you may wish to set this up as a recommended extension or configure other organization-level settings. Please refer to our docs.

## Development

```shell
pnpm install
pnpm watch
```

Press `F5` in VS Code to launch an Extension Development Host against the watch build. `pnpm build` produces the production bundle, and `pnpm run package-for-vscode` packs the installable `.vsix`.

## License

MIT
