import type { OrgInfo } from './api.mts'

export type OrganizationSelection =
  | { status: 'missing' }
  | { status: 'invalid' }
  | { status: 'unavailable' }
  | { status: 'inaccessible'; slug: string }
  | { status: 'ambiguous'; slug: string }
  | { status: 'selected'; organization: OrgInfo }

export function selectOrganization(
  configuredSlug: unknown,
  organizations: ReadonlyMap<string, OrgInfo> | undefined,
): OrganizationSelection {
  if (configuredSlug === undefined || configuredSlug === '') {
    return { status: 'missing' }
  }
  if (
    typeof configuredSlug !== 'string' ||
    configuredSlug.trim() !== configuredSlug
  ) {
    return { status: 'invalid' }
  }
  if (!organizations) {
    return { status: 'unavailable' }
  }
  const matches = Array.from(organizations.values()).filter(
    organization => organization.slug === configuredSlug,
  )
  if (matches.length === 0) {
    return { status: 'inaccessible', slug: configuredSlug }
  }
  if (matches.length > 1) {
    return { status: 'ambiguous', slug: configuredSlug }
  }
  return { status: 'selected', organization: matches[0]! }
}
