export interface StageDefinition {
  id: string;
  title: string;
  description: string;
  deliverables: string[];
}

export const BENCHMARK_STAGES: StageDefinition[] = [
  {
    id: 'S1',
    title: 'Launch CLI & Resolve SIGINT Entry Point',
    description:
      'Launch the cb CLI with help output and a resolved entry point capable of handling OS signals cleanly on BEAM.',
    deliverables: [
      'Executable CLI entry point & help output',
      'Resolved BEAM / POSIX signal handling entry point',
      'Clean project compilation with zero warnings',
    ],
  },
  {
    id: 'S2',
    title: 'Validate CLI Arguments',
    description:
      'Parse and validate command-line flags and target URL arguments, returning exit code 2 on invalid input.',
    deliverables: [
      'Strict argument validation & error reporting',
      'Exit code 2 on validation errors',
      'Unit and CLI tests for invalid argument combinations',
    ],
  },
  {
    id: 'S3',
    title: 'Bounded GET (Mint, TLS, 2s Timeout)',
    description:
      'Send bounded HTTP/HTTPS GET requests using Mint with response streaming, TLS verification, and a 2-second timeout.',
    deliverables: [
      'Streaming HTTP/HTTPS GET client via Mint',
      'TLS certificate verification',
      '2-second request timeout enforcement',
    ],
  },
  {
    id: 'S4',
    title: 'Paced 5-Second Loop',
    description:
      'Execute a paced 5-second benchmark loop with rate limiting and clean timeout cancellation.',
    deliverables: [
      'Rate-limited request pacing over a 5-second window',
      'In-flight request timeout cancellation',
      'Deterministic loop termination',
    ],
  },
  {
    id: 'S5',
    title: 'Report HTTP Outcomes & Exit Codes',
    description:
      'Aggregate and report HTTP status outcomes, connection/timeout errors, and return appropriate CLI exit codes.',
    deliverables: [
      'HTTP status class & error outcome tallying',
      'Formatted outcome summary output',
      'Exit code determination based on benchmark results',
    ],
  },
  {
    id: 'S6',
    title: 'Report Elapsed Time & Latency Percentiles',
    description:
      'Measure and report total elapsed benchmark wall-clock time along with request latency percentiles.',
    deliverables: [
      'High-resolution request latency recording',
      'Percentile calculation (p50, p95, p99, etc.)',
      'Elapsed time and timing summary formatting',
    ],
  },
  {
    id: 'S7',
    title: 'Handle Terminal Ctrl-C (SIGINT)',
    description:
      'Intercept terminal Ctrl-C (SIGINT) during an active benchmark run, print a partial summary, and exit with code 130.',
    deliverables: [
      'Graceful SIGINT interception without BEAM BREAK menu hang',
      'Partial benchmark summary output on interrupt',
      'Deterministic exit code 130 verified via PTY tests',
    ],
  },
];

export const BENCHMARK_PROMPT = `# Capy Bench Task Specification (PROMPT.md)

You are tasked with building an end-to-end autonomous task runner and telemetry harness from scratch.
Follow the implementation plan stages (S1 through S7) sequentially.

## Rules & Constraints
1. Work autonomously without human intervention.
2. Commit your work cleanly at logical checkpoints.
3. Every stage must have passing automated tests before moving to the next stage.
4. Properly handle OS signals (SIGINT / Ctrl-C) and background processes without busy-polling where event-driven primitives are available.

## Implementation Plan Checkpoints
- [ ] S1: Project Scaffolding & Core Data Model
- [ ] S2: Process Runner & Task Execution Engine
- [ ] S3: Signal Handling (SIGINT / Ctrl-C) & Graceful Shutdown
- [ ] S4: Persistence & Event Log Streaming
- [ ] S5: Interactive CLI & Stream Formatter
- [ ] S6: Retry Policies & Fault Recovery
- [ ] S7: Final Polish, Benchmarks & Documentation

## Verification Criteria
Run the full test suite before finishing. Ensure all unit and integration tests pass and the CLI produces valid stream-json telemetry.`;
