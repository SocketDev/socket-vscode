# Development

Install dependencies and start the development build:

```sh
pnpm install
pnpm watch
```

In Chrome, open `chrome://extensions/`, enable developer mode, select **Load
unpacked**, and choose the generated `dist/` directory. After edits, the watch
process rebuilds the extension; reload it from the extensions page.

## Build and package

Run `pnpm build` to produce the extension build. For browser store packaging,
use the release workflow maintained by the repository. Confirm the generated
manifest and assets in `dist/` before loading an unpacked build.

## Manual browser check

Open a supported registry package page to exercise link enhancement, popovers,
and PURL matching. See the [extension guide](extension.md) for supported page
data and permission details.
