# <picture><img width="32" height="32" alt="Socket Security Visual Studio Code Extension" src="https://raw.githubusercontent.com/SocketDev/socket-vscode/HEAD/assets/repo/socket-icon-brand-32.png"></picture> Socket Security Visual Studio Code Extension

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
```

Press `F5` in VS Code to build the extension and launch an Extension Development Host. Development builds include source maps for breakpoints in `src/`.

`pnpm run build` defaults to `build:dev`. Use `pnpm run build:prod` for a minified production build.

Run the `Socket: watch` task or `pnpm run watch` to rebuild on edits. Reload the Extension Development Host to load each rebuild.

Run the `Socket: test` task or `pnpm test --all` for the full test suite. Use `pnpm test test/repo/unit/auth.test.mts` to run one test file.

Run `pnpm run package-for-vscode` to build and package the production `.vsix`.

Run `pnpm run test:extension --vsix <path>` to test the packaged extension in an isolated VS Code Extension Host.
The smoke test checks activation, Login registration, logged-out state, and JavaScript document opening.
It requires the `code` executable on `PATH`, or `--code <executable>`.

## License

MIT
