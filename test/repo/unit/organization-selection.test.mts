import { describe, expect, test } from 'vitest'

import { selectOrganization } from '../../../src/organization-selection.mts'
import type { OrgInfo } from '../../../src/api.mts'

const organization: OrgInfo = {
  id: 'org-id',
  slug: 'acme',
  name: 'Acme',
  image: undefined,
  plan: 'enterprise',
}

describe('selectOrganization', () => {
  test('requires an explicit slug', () => {
    expect(
      selectOrganization(undefined, new Map([['org-id', organization]])),
    ).toEqual({ status: 'missing' })
    expect(selectOrganization('', new Map([['org-id', organization]]))).toEqual(
      { status: 'missing' },
    )
    expect(
      selectOrganization(' ', new Map([['org-id', organization]])),
    ).toEqual({ status: 'invalid' })
  })

  test('selects only an exact accessible slug', () => {
    const organizations = new Map([['org-id', organization]])
    expect(selectOrganization('acme', organizations)).toEqual({
      status: 'selected',
      organization,
    })
    expect(selectOrganization('org-id', organizations)).toEqual({
      status: 'inaccessible',
      slug: 'org-id',
    })
    expect(selectOrganization('Acme', organizations)).toEqual({
      status: 'inaccessible',
      slug: 'Acme',
    })
  })

  test('reports unavailable, inaccessible, and ambiguous choices', () => {
    expect(selectOrganization('acme', undefined)).toEqual({
      status: 'unavailable',
    })
    expect(
      selectOrganization('other', new Map([['org-id', organization]])),
    ).toEqual({ status: 'inaccessible', slug: 'other' })
    expect(
      selectOrganization(
        'acme',
        new Map([
          ['org-id', organization],
          ['org-id-2', { ...organization, id: 'org-id-2' }],
        ]),
      ),
    ).toEqual({ status: 'ambiguous', slug: 'acme' })
  })
})
