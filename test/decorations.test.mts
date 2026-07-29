/**
 * @file Hover rendering and decoration selection for a single PURL
 *   (src/ui/decorations.ts). Two properties are load-bearing for security:
 *   remote alert text and workspace-derived PURLs reach a `MarkdownString` that
 *   has `supportHtml` on, so every interpolation must arrive as inert text; and
 *   a lookup that FAILED must never pick the same marker as a package that came
 *   back clean.
 */

import { beforeEach, describe, expect, test, vi } from 'vitest'

import type { PackageScoreAndAlerts } from '../src/api'
import type { SimPURL } from '../src/ui/externals/parse-externals'

// decorations.ts pulls the live PURL cache, which reads a disk cache and issues
// Socket API requests on construction. Stand in a cache whose entries the test
// writes directly.
class StubPackageData {
  purl: SimPURL
  pkgData: PackageScoreAndAlerts | undefined = undefined
  error: string | undefined = undefined
  constructor(purl: SimPURL) {
    this.purl = purl
  }
  subscribe(_fn: unknown): void {}
  unsubscribe(_fn: unknown): void {}
}

const stubEntries = new Map<SimPURL, StubPackageData>()

// The Python extension's API package requires `vscode` through CJS, which the
// test-time `vscode` alias does not reach. decorations.ts only pulls it in for
// the builtin-module list.
vi.mock(import('@vscode/python-extension'), () => ({
  PythonExtension: { api: async () => undefined },
}))

// Only `DecorationManager` touches this, and these cases construct a single
// per-PURL manager. Stubbed to keep the document parser — and its `.py` / `.wasm`
// asset imports, which vite's transform pipeline cannot load — out of the graph.
vi.mock(import('../src/ui/decoration-manager-for-document'), () => ({
  DecorationManagerForDocument: class {},
}))

vi.mock(import('../src/ui/purl-alerts-and-scores/manager'), () => ({
  PURLDataCache: {
    singleton: {
      watch(purl: SimPURL) {
        let entry = stubEntries.get(purl)
        if (!entry) {
          entry = new StubPackageData(purl)
          stubEntries.set(purl, entry)
        }
        return entry
      },
    },
  },
}))

import {
  DecorationManagerForPURL,
  DecorationTypes,
} from '../src/ui/decorations'

const extensionContext = {
  asAbsolutePath: (relative: string) => `/ext/${relative}`,
} as never

function scoreAndAlerts(
  alerts: PackageScoreAndAlerts['alerts'],
): PackageScoreAndAlerts {
  return {
    alerts,
    name: 'left-pad',
    score: {
      license: 1,
      maintenance: 1,
      overall: 0.5,
      quality: 1,
      supplyChain: 1,
      vulnerability: 1,
    },
    type: 'npm',
    version: '1.3.0',
  } as PackageScoreAndAlerts
}

beforeEach(() => {
  stubEntries.clear()
})

describe('hover markdown is not trusted', () => {
  test('leaves isTrusted unset so a command: URI stays inert', async () => {
    const types = new DecorationTypes(extensionContext)
    const manager = new DecorationManagerForPURL('pkg:npm/left-pad', types)
    stubEntries.get('pkg:npm/left-pad')!.pkgData = scoreAndAlerts([])
    manager.packageData = stubEntries.get('pkg:npm/left-pad') as never

    const hover = await manager.generateHoverMarkdown()

    expect(hover.isTrusted).toBe(undefined)
    expect(hover.supportHtml).toBe(true)
  })
})

describe('hover markdown escapes untrusted text', () => {
  test('neutralizes html and markdown in a remote alert note', async () => {
    const types = new DecorationTypes(extensionContext)
    const manager = new DecorationManagerForPURL('pkg:npm/left-pad', types)
    const entry = stubEntries.get('pkg:npm/left-pad')!
    entry.pkgData = scoreAndAlerts([
      {
        action: 'error',
        type: 'malware',
        severity: 'critical',
        props: {
          note: '<img src=x onerror=alert(1)> [click](command:workbench.action.terminal.new)',
        },
      },
    ] as PackageScoreAndAlerts['alerts'])
    manager.packageData = entry as never

    const { value } = await manager.generateHoverMarkdown()

    // The payload survives as visible text; what it cannot do is open a tag.
    expect(value).not.toContain('<img')
    expect(value).toContain('&lt;img src=x onerror=alert\\(1\\)&gt;')
    // The link syntax is defanged, so `command:` can never become a URI.
    expect(value).not.toContain('](command:')
    expect(value).toContain('\\[click\\]')
  })

  test('neutralizes an alert type and a suggested alternate package', async () => {
    const types = new DecorationTypes(extensionContext)
    const manager = new DecorationManagerForPURL('pkg:npm/left-pad', types)
    const entry = stubEntries.get('pkg:npm/left-pad')!
    entry.pkgData = scoreAndAlerts([
      {
        action: 'warn',
        type: '<b>typo</b>',
        severity: 'low',
        props: { alternatePackage: 'evil) <script>x</script> (' },
      },
    ] as PackageScoreAndAlerts['alerts'])
    manager.packageData = entry as never

    const { value } = await manager.generateHoverMarkdown()

    expect(value).not.toContain('<b>')
    expect(value).not.toContain('<script>')
    // The parenthesis cannot terminate the link destination early.
    expect(value).toContain('%29')
  })

  test('neutralizes a workspace-derived purl', async () => {
    const types = new DecorationTypes(extensionContext)
    const hostile = 'pkg:npm/<img src=x>' as SimPURL
    const manager = new DecorationManagerForPURL(hostile, types)

    const { value } = await manager.generateHoverMarkdown()

    expect(value).not.toContain('<img')
    expect(value).toContain('&lt;img src=x&gt;')
  })
})

describe('a failed lookup is decorated as unknown', () => {
  test('picks a marker distinct from a clean package', () => {
    const types = new DecorationTypes(extensionContext)
    const manager = new DecorationManagerForPURL('pkg:npm/left-pad', types)
    const entry = stubEntries.get('pkg:npm/left-pad')!

    manager.packageData = entry as never
    manager.subscriptionCallback!(entry as never)
    expect(manager.decorationType).toBe(types.informativeDecoration)

    entry.error = 'Unable to load data from Socket API'
    manager.subscriptionCallback!(entry as never)
    expect(manager.decorationType).toBe(types.unknownDecoration)
    expect(manager.decorationType).not.toBe(types.informativeDecoration)
  })

  test('says unknown in the hover rather than reading as cleared', async () => {
    const types = new DecorationTypes(extensionContext)
    const manager = new DecorationManagerForPURL('pkg:npm/left-pad', types)
    const entry = stubEntries.get('pkg:npm/left-pad')!
    entry.error = 'Unable to load data from Socket API: ECONNREFUSED'
    manager.packageData = entry as never

    const { value } = await manager.generateHoverMarkdown()

    expect(value).toContain('**unknown**')
    expect(value).toContain('neither cleared nor flagged')
  })
})
