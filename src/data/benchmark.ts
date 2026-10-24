export interface StageDefinition {
  id: string;
  title: string;
  description: string;
  deliverables: string[];
}

export const BENCHMARK_STAGES: StageDefinition[] = [
  {
    id: 'S1',
    title: 'Launch the CLI',
    description:
      'Create the smallest Elixir project and executable cb. Test that cb --help and cb -h print usage to stdout and exit 0, and use a disposable foreground-terminal probe to confirm application code handles Ctrl-C.',
    deliverables: [
      'Executable cb printing usage to stdout with exit 0 on --help and -h',
      'Document build, run, test, and lint commands in README.md',
      'Confirm foreground-terminal Ctrl-C reaches application code (resolve entry-point choice if not)',
    ],
  },
  {
    id: 'S2',
    title: 'Validate arguments',
    description:
      'Test missing and malformed URLs, unsupported schemes, missing hosts, unknown flags, and extra arguments through the CLI.',
    deliverables: [
      'CLI tests for missing/malformed URLs, bad schemes, missing hosts, unknown flags, and extra args',
      'Require argument errors on stderr and exit code 2',
      'Ensure zero network requests are made on invalid input',
    ],
  },
  {
    id: 'S3',
    title: 'Send one bounded GET',
    description:
      'Test one CLI GET against local HTTP and HTTPS servers, verifying TLS certificates, streaming and discarding bodies, and enforcing the 2-second total timeout and cancellation.',
    deliverables: [
      'Accept trusted HTTPS test certs; reject untrusted and hostname-mismatched certs without disabling verification',
      'Test total timeout & cancellation for stalls before headers, during body, and trickling body',
      'Stream and discard bodies; verify no redirects (including cross-host) or retries after dropped connections',
    ],
  },
  {
    id: 'S4',
    title: 'Run a paced five-second loop',
    description:
      'Deterministically test at least 100 ms between dispatches, no catch-up, no dispatch at or after the deadline, and at most 50 starts across fast, delayed, and timed-out responses.',
    deliverables: [
      'Deterministic tests for >= 100 ms spacing, no catch-up bursts, deadline cutoff, and <= 50 starts',
      'Verify timed-out operations are cancelled before next start and final in-flight request settles before exit',
      'Exercise dropped connections on the connection reuse path to verify no automatic retries',
    ],
  },
  {
    id: 'S5',
    title: 'Report outcomes and exit codes',
    description:
      'Count completed HTTP responses by status (including 3xx, 4xx, and 5xx) and transport failures separately, verifying outcome invariants and CLI exit codes.',
    deliverables: [
      'Count completed HTTP responses by status code (2xx, 3xx, 4xx, 5xx) and transport failures separately',
      'Verify body timeouts count only as transport failures and started = responses + failures',
      'Verify CLI exits 0 with at least one completed response and exits 1 with none',
    ],
  },
  {
    id: 'S6',
    title: 'Report timing',
    description:
      'Add elapsed time and completed-response p50/p95 latency percentiles, testing exact ranks, setup inclusion, and post-deadline settlement.',
    deliverables: [
      'Deterministically test p50/p95 one-based ceil(p * count) ranks and the n/a case',
      'Verify request latency includes connection setup when needed, excludes pacing waits, and ends at body completion',
      'Test total elapsed time when the last in-flight request settles after the 5-second start deadline',
    ],
  },
  {
    id: 'S7',
    title: 'Handle Ctrl-C',
    description:
      'Test terminal-generated Ctrl-C against the actual foreground CLI both while pacing and during an in-flight request.',
    deliverables: [
      'Foreground terminal Ctrl-C tests both while pacing and during an active in-flight request',
      'Stop new starts immediately; let in-flight request complete or cancel within its original 2s timeout',
      'Print partial summary to stdout, preserve started = responses + failures invariant, and exit 130',
    ],
  },
];

export const BENCHMARK_PLAN = `# Capy Bench

Capy Bench's product contract and example output are in the
[README's V1 CLI contract](README.md#v1-cli-contract). Document that contract
first, then build outside-in against local test servers.

## Implementation slices

Complete Preparation first, then S1 through S7 in order. Mark a task complete
only after verifying its requirements. Implementation slices must pass
acceptance tests and all existing tests. Record verification commands and
blockers beneath each task. Completion does not authorize a commit.

Within each slice, add one failing behavior test at a time, implement only what
passes it. Documentation changes need no failing test. Keep the CLI runnable
after S1; intermediate output may be simpler than the final contract. Review
touched code and tests for simplification after each green step.

Use deterministic tests for exact timing rules and percentile ranks. Use the
actual CLI against local servers for HTTP behavior and bounded completion.
Server arrival times cannot prove exact dispatch spacing. Give integration tests
an outer timeout and allow scheduling tolerance without weakening deterministic
boundary assertions.

- [x] **Preparation: establish the README contract.** Move the product contract
      and example output into \`README.md\`. Replace the contract section in this
      plan with a link to the README section; do not retain a duplicate.

- [ ] **S1. Launch the CLI.** Create the smallest Elixir project and executable
      \`cb\`. Test that \`cb --help\` and \`cb -h\` print usage to stdout and exit 0.
      Document build, run, test, and lint commands in the README. Use a
      disposable foreground-terminal probe to confirm application code handles
      Ctrl-C. Resolve the entry-point choice if it does not. Leave partial
      summaries for S7.

- [ ] **S2. Validate arguments.** Test missing and malformed URLs, unsupported
      schemes, missing hosts, unknown flags, and extra arguments through the
      CLI. Require stderr errors, exit 2, and no network requests.

- [ ] **S3. Send one bounded GET.** Test one CLI GET against local HTTP and
      HTTPS servers. For HTTPS, accept a trusted test certificate. Reject
      untrusted and hostname-mismatched certificates without disabling
      verification. Test total timeout and cancellation for stalls before
      headers, during the body, and a trickling body. Stream and discard bodies.
      Verify no redirects, including cross-host redirects, or retries after
      dropped connections.

- [ ] **S4. Run a paced five-second loop.** Deterministically test at least 100
      ms between dispatches, no catch-up, no dispatch at or after the deadline,
      and at most 50 starts. Test the CLI with fast, delayed, and timed-out
      responses. Verify that a timed-out operation is cancelled before another
      starts and that the final in-flight request settles before exit. Exercise
      dropped connections on the reuse path to check for automatic retries.

- [ ] **S5. Report outcomes and exit codes.** Count completed HTTP responses by
      status, including 3xx, 4xx, and 5xx. Count transport failures separately.
      Test that a body timeout is only a failure and that started equals
      responses plus failures. Through the CLI, verify exit 0 with at least one
      completed response and exit 1 with none.

- [ ] **S6. Report timing.** Add elapsed time and completed-response p50/p95.
      Deterministically test the specified ranks and \`n/a\` case. Verify that
      request latency includes setup when needed, excludes pacing waits, and
      ends at body completion. Test elapsed time when the last request settles
      after the start deadline.

- [ ] **S7. Handle Ctrl-C.** Test terminal-generated Ctrl-C against the actual
      foreground CLI, both while pacing and during an in-flight request. Require
      no new starts, completion or cancellation within the request's original
      timeout, a partial summary on stdout, and exit 130. Check the
      outcome-count invariant for interrupted runs too.

## Release verification

After slice 7, run \`mix format --check-formatted\`, \`mix test\`, the lint command
documented in slice 1, and the built \`cb\` executable against local HTTP and
HTTPS servers. Repeat the foreground-terminal Ctrl-C check. Confirm that help
and results go to stdout, while errors and diagnostics go to stderr. Formatting
and compilation do not substitute for linting. Report any unverified checks
before handoff.

## Non-goals

V1 excludes configurable duration, timeout, or concurrency; distributed
execution; remote control; non-GET workloads; and dashboards. Do not introduce
architecture for these features yet.

A future remote service accepting untrusted targets requires a separate
network-security design covering IPv4, IPv6, redirects, and DNS changes.`;

export const BENCHMARK_README_CONTRACT = `cb <http-or-https-url>
cb --help
cb -h

- Accept exactly one absolute HTTP or HTTPS URL, or one of --help and -h
  alone. Reject malformed URLs, missing hosts, unsupported schemes, unknown
  flags, and extra arguments before making any request. Print help to stdout and
  exit 0; print argument errors to stderr and exit 2.
- Send GET requests during a five-second start window. Start the run clock after
  validation and application initialization, immediately before the first
  dispatch. Start no request at or after the deadline. Use monotonic time for
  scheduling and measurements.
- Allow only one request in flight, with at least 100 ms between dispatches.
  Never accumulate unused rate allowance or send catch-up bursts. The run can
  start at most 50 requests. Count a request as started when it is dispatched to
  the HTTP client.
- Give each request a two-second total timeout from dispatch through complete
  body receipt, including client queuing, DNS, connection establishment, and
  TLS. On expiry, cancel the underlying operation before starting another
  request or reporting results. Receiving headers or body chunks must not reset
  this timeout.
- Verify HTTPS certificate trust and hostname. Do not follow redirects or retry
  requests, including automatic client retries. A completed 3xx response counts
  as an HTTP response. Connection reuse is allowed; document the chosen client's
  reuse policy. Send no warm-up requests.
- Stream and discard response-body chunks rather than buffering complete bodies.
  A response counts only when its body completes. A timeout or other transport
  error before completion counts as a transport failure, even if headers have
  arrived.
- Print a final summary to stdout: elapsed time, requests started, completed
  HTTP responses by status code, transport failures, and latency p50/p95.
  Include 4xx and 5xx responses in HTTP counts and latency statistics. Require
  started = completed HTTP responses + transport failures.
- Measure request latency from dispatch through complete body receipt, including
  any queuing or connection setup for that request. Exclude failed requests from
  percentiles and print n/a when no response completed. Sort latencies and
  select the one-based rank ceil(p * count), using p = 0.50 and p = 0.95.
  These are completed-response percentiles, not a latency distribution that
  includes timeouts.
- Measure elapsed time from the run clock's start until the start window ends
  and all started requests have completed or failed. It can exceed five seconds.
  Exit 0 if at least one HTTP response completed, otherwise exit 1. Write
  diagnostics to stderr.
- On Ctrl-C, stop starting requests immediately. If a request is in flight, wait
  for it to complete or reach its original timeout. Print a partial summary to
  stdout and exit 130. End elapsed time at interruption if idle, or when the
  request settles; do not wait for the five-second deadline.
- Allow localhost. Require the operator to have permission to test any target.
  Traffic limits neither grant authorization nor establish that a target is safe
  to test. This local CLI provides no SSRF protection for a future remote
  service.`;

export const BENCHMARK_PROMPT = `Start by reviewing @AGENTS.md to align with the project's objectives.

Process the implementation in @PLAN.md one task at a time until all done. For
each unchecked task ([ ]): implement the logic, run the code formatter, mark the
implementation as complete ([x]), validate, proof of completion then commit your
changes with a concise message.

Complete all @PLAN.md work in this conversation.`;
