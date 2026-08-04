#!/usr/bin/env node
// Claude Code PreToolUse hook — agent-prompt-budget-guard.
//
// Blocks an EXPENSIVE, OPEN-ENDED subagent spawn (`Agent` / `Task`) whose
// prompt states NEITHER a wall-clock / tool-call BUDGET NOR a DONE-CONDITION.
// docs/agents.md/fleet/agent-delegation.md already requires both — "state the
// expected response shape AND a wall-clock budget in the prompt itself", with
// tiers of ~1 min (sanity), ~3 min (second implementation), ~10 min (deep
// rescue). Nothing enforced it. On 2026-08-03 seven subagents ran 40-129
// minutes each, 117-203 tool calls, because every brief bundled several
// deliverables behind an open-ended investigation and none carried a budget.
//
// A stated budget is also CAPPED at MAX_BUDGET_MINUTES, checked ahead of the
// open-ended gate so a short brief buying an hour is caught too. Requiring a
// number without bounding it just moves the unbounded spawn behind a figure
// the author never expects to reach.
//
// GUARD, not nudge — deliberately, and against the usual "advisory first"
// default:
//   - A `notify` verdict exits 0. On the PreToolUse path exit-0 stderr is
//     transcript decoration; the exit-2 block message is what is handed BACK to
//     the model. The party who must fix the prompt is the spawning model, so an
//     advisory verdict does not reach the only reader who can act on it.
//   - The advisory form of this law has already been tried and lost. The
//     doctrine was written down, five spawn-time nudges were live, and the
//     2026-08-03 fan-out still shipped seven unbounded briefs. Repeating prose
//     louder is not an intervention.
//   - The usual argument against a guard — "a block on legitimate work gets
//     bypassed, then ignored" — turns on how expensive the block is to clear.
//     Here it is one line of prompt text ("Budget: ~5 min. Done = the failing
//     assertion named with file:line."), authored by the same model that is
//     mid-spawn, with no state to rebuild. A guard whose remedy is cheaper than
//     its bypass does not train people to bypass it.
//   - Precision is bought at the DETECTOR, not by downgrading the verdict: the
//     guard is silent unless the brief is BOTH long (>= MIN_BRIEF_WORDS) AND
//     carries an open-ended signal. A short one-shot spawn never fires, and
//     `SendMessage` (resuming an agent that already has its context and its
//     original budget) is a different tool name and is never matched.
//
// Detection is regex over PROSE, not over commands — no shell binary appears in
// any pattern (no-hook-cmd-regex-guard matches command-structure regexes, which
// these are not). Plain `.includes` cannot express "N minutes" / "N tool
// calls", which are the natural spellings the doc asks us to accept.
//
// Honest scope: a long, tightly-scoped brief with no open-ended verb is not
// matched. That false negative is chosen — the doc's own line is that "Audit
// our cascade infrastructure" is the shape that fails, and a false positive on
// every spawn gets the hook deleted within a day. A Workflow `agent()` spawn
// bypasses PreToolUse entirely (platform limit), same as its sibling hooks.
//
// Bypass: `Allow agent-budget bypass` in a recent turn.
//
// Exit codes: 0 pass, 2 block. Fails open on malformed payloads.
//
// Detail: docs/agents.md/fleet/agent-delegation.md.

import { block, defineHook, runHook } from '../_shared/guard.mts'
import type { GuardResult } from '../_shared/guard.mts'
import type { ToolCallPayload } from '../_shared/payload.mts'

// Below this word count a spawn is a cheap one-shot ("find where X is
// defined"), not the multi-deliverable investigation this guard exists for.
//
// Tuned against 2100 real spawns from 2026-07-01 to 2026-08-03, not guessed.
// The first cut was 60, which turned out to admit 98.7% of all spawns — the
// median brief is 369 words, six times that, so the word gate discriminated
// almost nothing and the whole verdict rested on the open-ended signal. 500
// targets the upper decile, which is where the 40-to-129-minute runs of
// 2026-08-03 actually lived. Fire rate at this setting: 9.7% of spawns.
export const MIN_BRIEF_WORDS = 500

// Lowercased substrings that mark a brief as OPEN-ENDED — work whose end is
// discovered rather than stated. One of these PLUS MIN_BRIEF_WORDS is the
// "expensive delegation" precondition; neither alone fires.
const OPEN_ENDED_SIGNALS: readonly string[] = [
  'across the codebase',
  'across the repo',
  'audit',
  'catalog',
  'comprehensive',
  'deep dive',
  'deep-dive',
  'diagnose',
  'end-to-end',
  'exhaustive',
  'explore',
  'figure out',
  'find out why',
  'inventory',
  'investigate',
  'investigation',
  'migrate',
  'research',
  'root cause',
  'root-cause',
  'survey',
  'sweep',
  'triage',
  'whatever it takes',
  'wherever',
]

// A stated ceiling on the work: wall-clock, tool calls, or response length.
// Deliberately plural spellings — the doc says accept the natural ones, not one
// blessed phrasing.
const BUDGET_PATTERNS: readonly RegExp[] = [
  // "Budget: 30 tool calls", "time budget", "token budget".
  /\bbudget\b/i,
  // "within ~2 minutes", "in 15 min", "under 5 minutes", "90 seconds".
  /\b~?\s*\d+\s*-?\s*(?:s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours)\b/i,
  // "stop after 30 tool calls", "40 tool-call ceiling".
  /\b~?\s*\d+\s*tool[\s-]?calls?\b/i,
  // "reply in under 200 words", "at most 150 words".
  /\b(?:at most|fewer than|less than|max|no more than|under|within)\s+~?\s*\d+\s*words\b/i,
  // "time-box this", "timeboxed to one pass".
  /\btime\s?-?\s?box(?:ed|ing)?\b/i,
  // "wall-clock ceiling", "wall clock limit".
  /\bwall\s?-?\s?clock\b/i,
  // "timeout 120", "hard timeout".
  /\btimeout\b/i,
]

// The longest wall-clock a spawn may declare. Measured, not guessed: a
// seven-file module consolidation with tests and a cascade finished in 10.4
// minutes, so ten is enough for real work and short enough that a stall
// surfaces while the main session can still act on it. A budget the author
// never expects to reach is the same unbounded spawn wearing a number.
export const MAX_BUDGET_MINUTES = 10

// Wall-clock figures a prompt can state, normalized to minutes.
const WALL_CLOCK_RE =
  /\b~?\s*(\d+(?:\.\d+)?)\s*-?\s*(s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours)\b/gi

function toMinutes(value: number, unit: string): number {
  const u = unit.toLowerCase()
  if (u.startsWith('h')) {
    return value * 60
  }
  if (u.startsWith('s')) {
    return value / 60
  }
  return value
}

/**
 * The largest wall-clock ceiling the prompt states, in minutes. A brief that
 * names several ("~20 minutes / 80 tool calls, retry for 30 seconds") is held
 * to its longest, because that is the one that parks the session.
 */
export function largestStatedMinutes(prompt: string): number | undefined {
  let largest: number | undefined
  for (const m of prompt.matchAll(WALL_CLOCK_RE)) {
    const minutes = toMinutes(Number(m[1]), m[2]!)
    if (largest === undefined || minutes > largest) {
      largest = minutes
    }
  }
  return largest
}

// An explicit statement of what FINISHED looks like. A prompt that only lists
// work is not enough — that is precisely the 2026-08-03 shape.
const DONE_PATTERNS: readonly RegExp[] = [
  // "done = PR open with CI green", "Done when the root cause is named",
  // "done:", "done is", "done means".
  /\bdone\s*(?::|=|\bis\b|\bmeans\b|\bwhen\b)/i,
  // "you are done when", "you're finished when".
  /\byou(?: are|'re)\s+(?:done|finished)\b/i,
  // "definition of done", "done-condition".
  /\bdefinition of done\b/i,
  /\bdone\s?-\s?condition\b/i,
  // "success criteria", "acceptance criteria", "exit criteria".
  /\b(?:acceptance|exit|success)\s+(?:conditions?|criteria|criterion)\b/i,
  // "stop when the assertion is named", "finished when CI is green".
  /\b(?:complete|finish|stop)(?:ed|s)?\s+when\b/i,
  // "expected output:", "expected response =".
  /\bexpected\s+(?:answer|outcome|output|response|result|shape)\s*(?::|=)/i,
  // "Deliverable: the file path and the line number."
  /\bdeliverables?\s*(?::|=)/i,
]

function firstMatch(
  patterns: readonly RegExp[],
  prompt: string,
): string | undefined {
  for (let i = 0, { length } = patterns; i < length; i += 1) {
    const matched = patterns[i]!.exec(prompt)
    if (matched) {
      return matched[0].trim()
    }
  }
  return undefined
}

/**
 * The open-ended signal present in `prompt`, when the brief is ALSO long enough
 * to be a real delegation. `undefined` means "not the expensive shape" — a
 * short one-shot, or a long but tightly-scoped brief.
 */
export function openEndedSignal(prompt: string): string | undefined {
  const words = prompt.trim().split(/\s+/u).filter(Boolean)
  if (words.length < MIN_BRIEF_WORDS) {
    return undefined
  }
  const lower = prompt.toLowerCase()
  for (let i = 0, { length } = OPEN_ENDED_SIGNALS; i < length; i += 1) {
    const signal = OPEN_ENDED_SIGNALS[i]!
    if (lower.includes(signal)) {
      return signal
    }
  }
  return undefined
}

/**
 * The stated budget in `prompt` (wall-clock, tool-call, or response-length
 * ceiling), or `undefined` when the prompt states none.
 */
export function statedBudget(prompt: string): string | undefined {
  return firstMatch(BUDGET_PATTERNS, prompt)
}

/**
 * The stated done-condition in `prompt`, or `undefined` when the prompt only
 * lists work.
 */
export function statedDoneCondition(prompt: string): string | undefined {
  return firstMatch(DONE_PATTERNS, prompt)
}

export const check = (payload: ToolCallPayload): GuardResult => {
  // Both spawn-tool names: Claude Code's classic `Task` and this harness's
  // `Agent`, matching the sibling spawn hooks. `SendMessage` is intentionally
  // absent — resuming an existing agent inherits the original brief's budget,
  // so re-demanding one there would fire on every follow-up.
  if (payload.tool_name !== 'Agent' && payload.tool_name !== 'Task') {
    return undefined
  }
  // `prompt` is the spawn tool's instruction field — not in payload.mts's
  // narrowed ToolInput union, so read it via a local shape (never `any`).
  const input = payload.tool_input as
    | { prompt?: unknown | undefined }
    | undefined
  const prompt = typeof input?.prompt === 'string' ? input.prompt : ''
  if (!prompt) {
    return undefined
  }
  // Checked ahead of the open-ended gate: an over-long ceiling parks the
  // session whatever the brief's length, so a short prompt declaring an hour
  // is caught too.
  const stated = largestStatedMinutes(prompt)
  if (stated !== undefined && stated > MAX_BUDGET_MINUTES) {
    const rounded = Number.isInteger(stated)
      ? String(stated)
      : stated.toFixed(1)
    return block(
      [
        '[agent-prompt-budget-guard] Budget too generous.',
        '',
        `  What:   the prompt allows ${rounded} minutes of wall-clock.`,
        '  Where:  the spawn prompt.',
        `  Saw:    ~${rounded} min, wanted at most ${MAX_BUDGET_MINUTES} min.`,
        '',
        '  Pick the smallest tier likely to succeed:',
        '    - sanity check          ~1 min',
        '    - second implementation ~3 min',
        '    - deep rescue           ~10 min',
        '',
        '  A ceiling the author never expects to reach is an unbounded spawn',
        '  wearing a number. Split the work and spawn again instead of buying',
        '  more time: a partial result on time beats a complete one an hour',
        '  late. See agent-delegation.md.',
      ].join('\n'),
    )
  }
  const signal = openEndedSignal(prompt)
  if (!signal) {
    return undefined
  }
  const budget = statedBudget(prompt)
  const done = statedDoneCondition(prompt)
  // BOTH must be missing to fire, not either. Over the 2026-07/08 sample only
  // 2.5% of briefs stated a done-condition at all, so an either-missing rule
  // fires on 29.3% of spawns — a block on nearly a third of all delegation
  // gets bypassed on day one and then ignored. Requiring both absent isolates
  // the genuinely unbounded brief and leaves a stated budget alone as
  // sufficient evidence the author thought about cost.
  if (budget || done) {
    return undefined
  }
  // Reaching here means BOTH are absent, so the message states both outright.
  // An earlier draft assembled it from a `missing` list with a per-field
  // ternary for each "found" line; under the both-missing rule none of those
  // branches was reachable, and an unreachable branch in a guard is a claim
  // no test can hold to account.
  return block(
    [
      '[agent-prompt-budget-guard] Open-ended spawn missing a BUDGET (wall-clock or tool-call ceiling) and a DONE-CONDITION (what finished looks like).',
      '',
      `  The prompt reads as open-ended ("${signal}") and runs past`,
      `  ${MIN_BRIEF_WORDS} words, so it is an expensive delegation.`,
      '  No budget found: no wall-clock, tool-call, or word ceiling.',
      '  No done-condition found: the prompt lists work, not completion.',
      '',
      '  Add both to the prompt itself and re-spawn. Pick the smallest tier',
      '  likely to succeed:',
      '    - sanity check          ~1 min',
      '    - second implementation ~3 min',
      '    - deep rescue           ~10 min',
      '',
      '  Example line to paste into the prompt:',
      '    "Budget: ~3 minutes / 30 tool calls. If you pass that, STOP and',
      '     report what landed. Done = the failing assertion named with',
      '     file:line and a one-paragraph cause."',
      '',
      '  An unbounded agent parks the main session: on 2026-08-03 seven',
      '  spawns ran 40-129 minutes each. A partial result on time beats a',
      '  complete one an hour late. See agent-delegation.md.',
    ].join('\n'),
  )
}

export const hook = defineHook({
  bypass: ['agent-budget'],
  check,
  event: 'PreToolUse',
  matcher: ['Task', 'Agent'],
  type: 'guard',
})
void runHook(hook, import.meta.url)
