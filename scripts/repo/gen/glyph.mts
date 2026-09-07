import type { RepoGlyph } from '../../fleet/gen/glyph-types.mts'

const GLYPH_PARTS = [
  {
    paths: [
      'M17.6 2.3 21.7 4.4V19.6L17.6 21.7 8.2 14.4 4.1 17.5 2.3 16.2 5.9 12 2.3 7.8 4.1 6.5 8.2 9.6ZM17.4 7.2 11.2 12 17.4 16.8Z',
    ],
  },
] satisfies RepoGlyph['parts']

export const REPO_GLYPH = {
  label: 'Socket for VS Code',
  parts: GLYPH_PARTS,
  source: 'The VS Code ribbon silhouette, the host product this extends.',
  viewBox: '0 0 24 24',
} satisfies RepoGlyph
