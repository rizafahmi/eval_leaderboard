export interface StageDefinition {
  id: string;
  title: string;
  description: string;
  deliverables: string[];
}

export const BENCHMARK_STAGES: StageDefinition[] = [
  {
    id: 'S1',
    title: 'Project Scaffolding & Core Data Model',
    description:
      'Initialize the OTP / Mix project structure, configure dependencies, and implement the core state schemas and supervision tree.',
    deliverables: [
      'Clean project compilation with zero warnings',
      'Core domain structs & validation logic',
      'Unit tests for foundational state transitions',
    ],
  },
  {
    id: 'S2',
    title: 'Process Runner & Task Execution Engine',
    description:
      'Build the supervised worker pool capable of spawning, monitoring, and streaming stdout/stderr from background system tasks.',
    deliverables: [
      'Non-blocking port/process orchestration',
      'Structured event stream emission',
      'Timeout and exit-code capture',
    ],
  },
  {
    id: 'S3',
    title: 'Signal Handling (SIGINT / Ctrl-C) & Graceful Shutdown',
    description:
      'Ensure child processes and Elixir/Erlang VM nodes trap OS signals cleanly without leaving orphan processes or corrupted state.',
    deliverables: [
      'Deterministic SIGINT / SIGTERM propagation',
      'Graceful state flush before exit',
      'Zero zombie OS processes under stress tests',
    ],
  },
  {
    id: 'S4',
    title: 'Persistence & Event Log Streaming',
    description:
      'Record structured JSONL execution traces to disk with atomic writes and crash-recovery replay support.',
    deliverables: [
      'Append-only JSONL telemetry writer',
      'Session resume from partial logs',
      'Backpressure-safe file I/O',
    ],
  },
  {
    id: 'S5',
    title: 'Interactive CLI & Stream Formatter',
    description:
      'Expose the command-line interface flags, real-time progress rendering, and machine-readable output modes.',
    deliverables: [
      'CLI argument parser (--mode, --output-format, --print)',
      'Clean ANSI progress display & summary table',
      'End-to-end integration test suite (59 assertions)',
    ],
  },
  {
    id: 'S6',
    title: 'Retry Policies & Fault Recovery',
    description:
      'Handle transient rate-limits, tool execution errors, and corrupted workspace states with bounded exponential backoff.',
    deliverables: [
      'Configurable retry budget per step',
      'Automatic rollback on failed file edits',
      'Chaos test coverage for simulated failures',
    ],
  },
  {
    id: 'S7',
    title: 'Final Polish, Benchmarks & Documentation',
    description:
      'Complete end-to-end verification, performance profiling, and comprehensive README usage docs.',
    deliverables: [
      '100% test suite pass with zero leaked tasks',
      'Sub-50ms startup overhead benchmark',
      'Complete architecture & operator documentation',
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
