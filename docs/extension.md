# Socket Security browser extension

The extension identifies package references in web pages and links them to
Socket security information. It supports npm, PyPI, Maven Central, RubyGems,
pkg.go.dev, and NuGet package pages, as well as install commands and PURL
strings found in page text.

## Install

- [Chrome, Chromium, Edge, Brave, Vivaldi, and Arc](https://chrome.google.com/webstore/detail/socket-security/)
- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/socket-security/)

After installation, registry package links gain a score badge and an alert
popover. Detected install commands and PURLs link to the corresponding Socket
package page. The toolbar popup summarizes alert severity for the current tab.

## Page matching

The content script runs on pages permitted by the extension's `<all_urls>`
content-script match. It identifies package links on supported registries,
install commands in page text, and PURL strings. For each matched package
coordinate, the extension requests public package data from Socket's firewall
API. It batches up to 50 lookups, sends up to 20 requests concurrently, and
caches results for 15 minutes.

## Data and privacy

Each lookup sends the matched package coordinate, such as `pkg:npm/lodash`,
using an anonymous HTTPS GET to `firewall-api.socket.dev`. Requests contain no
API token or account credential. The extension does not send page URLs, page
contents, titles, browsing history, personal information, cookies, or page
HTML.

The Chrome popup can use the built-in `LanguageModel` API on Chrome 138 or
newer to summarize the four saved severity totals. The prompt contains counts
only and runs on-device. If Chrome needs its model, the popup offers a
user-triggered download. There is no hosted AI fallback, and neither the prompt
nor its output is sent to Socket. Browser-managed model versions can produce
different summaries.

## Permissions

The extension has outbound host permissions for `socket.dev`, `api.socket.dev`,
and `firewall-api.socket.dev`. It uses `storage` for the local cache and
`alarms` for periodic cleanup. `scripting` and npm registry host access are
optional permissions used by product features when granted. It does not
request broad tab, cookie, web-navigation, or web-request permissions.

## Troubleshooting

- Open the toolbar popup to see the current tab's alert totals.
- Reload the page after enabling or updating the extension to scan content
  that loaded before the extension was active.
- Confirm the browser granted optional permissions when a feature asks for
  registry access or scripting.
- Exercise link matching, popovers, and PURL detection on a real package page
  after loading the development build.

## Development

See the [development guide](development.md) for build and browser test steps.
