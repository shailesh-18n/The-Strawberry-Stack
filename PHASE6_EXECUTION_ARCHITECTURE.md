# Phase 6 Practical Assessment Engine — Architecture and Security Boundaries

**Status:** Initial coding-assessment MVP implemented via OnlineCompiler.io; no self-hosted runner or cloud deployment provisioned  
**Prepared:** 2026-11-06  
**Phase boundary:** Phase 5 verification passed. The user requested a separate
Oracle Always Free runner using gVisor if supported, with Render hosting the
web application. No cloud resources or runner have been provisioned. Phase 7
SkillTrack is now implemented separately. Do not start Phase 8.

## Current implementation

The mounted `/assessment` routes include fixed-answer quizzes and one fixed
Python List Sum coding challenge. The coding route validates consent, source
size, per-student request rate, and an idempotency key, then sends the source
and trusted tests to OnlineCompiler.io. It persists bounded results and a
minimal `SkillTrackProgress` record; only a source hash is retained, and
passing adds the skill reference. Express does not execute submitted code.
The MVP has one server-defined challenge; challenge-authoring CRUD is not
implemented. Scoring uses the provider's deterministic test-case verdicts,
not AI evaluation.

This is a third-party managed execution integration. The provider documents
fresh gVisor sandboxes with networking disabled, no capabilities, read-only
images, 2 CPU cores, 512 MB memory, 16 processes, and a 30-second execution
limit. These are provider statements and have not been independently audited
or tested by VidyaChain. Its Free-plan disclosure states up to 90-day
submission retention. The integration's live provider/MongoDB test is opt-in;
the test passed on 2026-11-06 after the local configuration was updated with
an active REST API key. The proposal below documents a separate self-hosted
architecture as a possible future direction, not as the current implementation.

The Phase 5 PWA and offline-learning behavior has been verified, including
native installation as a Chrome desktop app. Render/Oracle deployment and
the app-to-runner broker are not part of the current runtime.

## Options considered

| Option | Security boundary and resource controls | Windows 11 development | Linux deployment | Complexity and cost |
|---|---|---|---|---|
| Native OS isolation | Windows Job Objects can constrain and terminate process trees, but are not by themselves a filesystem/network security boundary. Windows Sandbox provides a disposable hypervisor-isolated Windows VM; networking is enabled by default and must be disabled. Linux namespaces, seccomp, cgroups, and mandatory access controls are available for the runner. | Native Windows requires a separate Windows-specific runner and careful restricted-token/AppContainer, ACL, Job Object, and network policy work. Windows Sandbox is edition-dependent and is not a practical per-submission service. WSL2 can provide Linux for development, but is not installed in the current environment and is not production evidence. | Stronger, more familiar primitives for a service runner. | Native Windows policy and Linux production behavior would diverge. Linux resource limits require kernel support and must be tested on the actual deployment host. |
| nsjail on dedicated Linux | Uses namespaces, chroot/pivot-root, seccomp-BPF, cgroups, and CPU, memory, process, file-descriptor, and wall-time limits. It still shares the host Linux kernel; a kernel or policy escape remains possible. | Not a native Windows executable. Development would need WSL2 or a remote Linux VM; neither is currently configured here. | Direct Linux deployment. Requires correct kernel/user-namespace and cgroup configuration, carefully built read-only runtime roots, and tested seccomp policies. | Open source and no per-submission vendor fee; moderate-to-high security engineering and operations burden. Lower isolation layer than gVisor. |
| gVisor `runsc` with OCI | Adds a userspace application kernel/Sentry between the program and host kernel, in addition to container controls. It reduces, but does not eliminate, escape and side-channel risk. Cgroups, process, memory, CPU, filesystem, network, seccomp, and host hardening still matter. | Linux-only runtime requirements mean Windows development needs WSL2/Linux or a remote runner. WSL2 is not installed here. | Supported on Linux 5.6+ and x86_64/ARM64. Official setup integrates `runsc` with Docker/OCI tooling; host and runtime versions must be pinned and maintained. | Recommended self-hosted direction for untrusted code, but requires a dedicated Linux VM/host, an OCI runtime such as Docker, gVisor operations, image maintenance, and security testing. No Docker daemon/socket may be exposed to Express. Infrastructure has a hosting cost; no cost estimate is possible before a host/region/SLA is selected. |
| Managed execution service (example: Judge0) | Provider operates the sandbox, subject to its implementation, configuration, contract, retention, region, and incident controls. It is not a trust-free boundary: submitted source and test input leave VidyaChain. | Easy to call from Windows or Linux; does not provide local sandbox parity. | No runner host to operate, but the application remains dependent on the provider API and quotas. Self-hosted Judge0 CE is a different option and requires Linux plus Docker Compose. | Fastest integration, recurring cost and vendor/privacy review. The official pricing page showed €27/month for 2,000 submissions/day and €0.001 per additional submission when checked; pricing can change. No account or API request was created. |

### Requested deployment direction

The user's deployment request selects a **dedicated Oracle Always Free ARM64
Linux VM using gVisor `runsc` through an OCI runtime if tenancy capacity is
available**. The user also requires that the runner not be publicly exposed.
Do not put Docker, its daemon, the runtime, or student execution in the Express
process or on the web host. Docker would be a runner-host dependency only
because the documented `runsc` integration uses an OCI runtime; it is not the
security boundary. Disable
privileged mode, drop all capabilities, use a read-only root filesystem,
disable networking, avoid host mounts, apply cgroup limits, and keep the
Docker socket unavailable to application and sandbox processes.

If Oracle Always Free capacity or gVisor is unavailable, stop and reassess
before choosing another execution host. Do not silently substitute a Windows
child process, Node `vm`, JavaScript timeout, or ordinary container.

OnlineCompiler.io is the currently configured managed provider. The form
requires explicit disclosure consent before sending code/test input. Do not
send secrets, personal data, or sensitive real student submissions; review
provider retention, region, quotas, and privacy terms before real deployment.

## Proposed execution flow

1. Authenticated, CSRF-protected Express routes validate the challenge ID,
   pinned language, source byte length, attempt rate, and idempotency key.
   Express stores a queued submission and does not execute or compile source.
2. A trusted dispatcher claims a queued record with an atomic lease and sends
   only the pinned challenge version, bounded source, and an opaque job ID over
   a private authenticated channel to the runner. The runner receives no
   MongoDB, session, AI-provider, or cloud credentials.
3. The runner obtains trusted hidden tests from a server-controlled challenge
   version; users cannot provide or modify test cases or runtime limits.
   Each test runs in a fresh, disposable gVisor sandbox with a read-only
   runtime image, a per-run temporary filesystem, no network, and hard resource
   limits. No host paths or sockets are mounted into the sandbox.
4. The runner returns a bounded result document only: verdicts, counts, capped
   timing/resource metadata, and a request ID. It does not return hidden
   expected values or unbounded program output. The dispatcher persists the
   terminal result idempotently and updates the student's assessed-skill
   reference only when the deterministic test policy passes.
5. The student can poll a private submission-status endpoint. Idempotency
   keys ensure browser/network retries return the same submission rather than
   create duplicate execution jobs.

The existing fixed-answer `StudentAssessment` behavior remains separate. A
future `CodingChallenge` record should reference a `Skill`, pin a version and
language, expose only statement/starter code/public examples, and keep hidden
tests and execution limits server-side. A separate `CodingSubmission` record
should record owner, challenge/version, source hash, status, deterministic
score, passed/total tests, bounded per-test verdicts, timestamps, and a unique
per-student idempotency key. Whether raw source is retained, encrypted, and
for how long is an unresolved privacy/product decision; do not silently add
unbounded or indefinite code retention.

## Provisional pilot limits

These are conservative **proposal values**, not implemented settings or
benchmarked guarantees. Confirm with the chosen language/runtime and load tests
before enabling submissions.

| Limit | Proposed initial value | Enforcement |
|---|---:|---|
| Language | Python 3 only, pinned image/runtime | Server-side challenge allowlist; no user-selected compiler flags or packages |
| HTTP request body | 64 KiB | Express parser limit and reverse-proxy limit |
| Source | 32 KiB UTF-8, one file | Byte-count validation before queueing and again at runner |
| Hidden cases | Up to 10 per challenge version | Trusted, immutable server-side challenge data |
| Input per case | 4 KiB; 32 KiB total per challenge | Challenge validation and bounded stdin |
| CPU | 1 CPU maximum; 1 CPU-second per case | cgroup CPU quota plus runtime CPU-time limit |
| Wall time | 3 seconds per case; 20 seconds total execution | Sandbox supervisor timeout; kill sandbox and all descendants |
| Memory | 128 MiB per sandbox | Hard cgroup memory limit; do not rely only on language/runtime settings |
| Processes/threads | 16 total | PID namespace and cgroup pids limit |
| File descriptors | 32 | Runtime `nofile` limit |
| Filesystem | Read-only image; 16 MiB per-job tmpfs; 16 MiB file-size cap | No host mounts, writable shared directories, or persistent workspace |
| Network | None, including DNS and loopback to other jobs | Network namespace with no interface plus host-level egress policy |
| Output | 64 KiB combined stdout/stderr per case | Byte-counting pipe collector; terminate on overflow; never buffer without a cap |
| Queue/concurrency | 1 running job per student; 4 global workers; bounded queue of 100 | Dispatcher lease, per-student rate limit (proposed 5/minute), global backpressure |

Any timeout, OOM, output overflow, signal, worker crash, or policy violation
must produce a stable non-passing verdict, terminate the complete sandbox
cgroup, and leave the web process and other jobs responsive. Resource caps
must also be applied outside the guest (host VM quota and worker concurrency).

## Required security verification before release

Run these only against a disposable staging runner/VM with synthetic data.
Never run these cases directly in Express, a developer shell, or production.

| Test | Expected result |
|---|---|
| Correct solution across normal, boundary, and multiple hidden cases | Deterministic pass score; correct case count and persisted result |
| Wrong output, partial correctness, exception, syntax error | Stable non-pass/partial result; no skill marked verified unless pass policy is met |
| Empty/oversized source, invalid challenge/language, malformed request, Unicode | Validation rejection before runner; bounded 4xx result; no job created |
| Duplicate idempotency key and client retry | One submission/one execution; same persisted status returned |
| Infinite loop and sleep-based timeout | CPU/wall limit verdict; complete sandbox tree terminated; unrelated health and web requests remain responsive |
| Memory exhaustion and allocation loop | cgroup OOM/limit verdict; runner and host remain healthy; no cross-job effect |
| Infinite stdout/stderr | Output-limit verdict; collection stops at cap; bounded DB and HTTP result |
| Read/write attempts at system files, `.env`, host paths, sibling jobs, and `/proc` | No host secrets or writable host files visible; only the declared read-only image and per-job tmpfs accessible |
| DNS, loopback, RFC1918, metadata-service, and public network attempts | Connection fails; no packets can reach host, other jobs, private services, or the internet |
| Process-spawn/fork bomb, detached child, descriptor exhaustion | PID/FD limits reached; entire cgroup terminated; no surviving descendants |
| Timeout during compile/run, worker crash, duplicate callback | Job lease recovers; terminal result written at most once; no stale sandbox or duplicate skill update |
| Concurrent valid and hostile submissions | Per-user/global limits hold; no test/source/result crosses students; web/database remain available |
| Hidden-test and output leakage | API and logs contain no expected hidden values, secrets, or unbounded source/output |
| Persistence/skill integration | MongoDB stores accurate owner/challenge/version/score/verdicts; pass updates the correct skill once; fail never does |
| Runner authentication and malformed callback | Unauthenticated or mismatched job results are rejected; replayed callbacks are idempotent |

## Platform and operational gates

- The current development host is Windows; `wsl --status` reports that WSL is
  not installed, and Docker, Podman, nsjail, and gVisor are unavailable.
  Windows 11 alone does not provide Linux namespaces, seccomp, cgroups, or
  `runsc`. No local runner has been installed.
- Windows Sandbox is a disposable VM available only on supported Pro,
  Enterprise, and Education editions; its networking is on by default and it
  allows only one instance at a time. It is useful for manual experiments, not
  the recommended high-concurrency Linux production service.
- gVisor requires Linux 5.6+ and an OCI runtime integration. A Windows
  developer may build the web application locally but must validate execution
  policy on a production-like Linux kernel/runtime. WSL2 may assist Linux
  development after approval, but does not replace production host hardening.
- Do not expose the Docker API/socket over TCP or mount it into Express or
  student sandboxes. Docker documentation warns that daemon control can mount
  host filesystems and effectively grants host-level authority.
- Pin and patch the runner image, gVisor/OCI runtime, kernel, and challenge
  runtimes; monitor CVEs. Keep the runner host isolated from MongoDB and AI
  provider secrets, with outbound network denied by default.
- No paid execution service, managed infrastructure, Docker, Kubernetes,
  runner code, sandbox configuration, or student-code execution has been
  introduced. The Render Blueprint and deployment limits are documented in
  `DEPLOYMENT.md`.

## References

Official documentation consulted on 2026-11-06:

- [Docker Engine security](https://docs.docker.com/engine/security/) —
  namespaces, cgroups, daemon attack surface, capabilities, and hardening.
- [Docker rootless mode](https://docs.docker.com/engine/security/rootless/) —
  non-root daemon prerequisites and limitations.
- [Docker resource constraints](https://docs.docker.com/engine/containers/resource_constraints/) —
  container CPU/memory constraints and host OOM risks.
- [gVisor overview](https://gvisor.dev/docs/) and
  [security model](https://gvisor.dev/docs/architecture_guide/security/) —
  userspace Sentry, threat model, reduced host-kernel exposure, and residual
  risk.
- [gVisor installation](https://gvisor.dev/docs/user_guide/install/) and
  [Docker quick start](https://gvisor.dev/docs/user_guide/quick_start/docker/) —
  Linux 5.6+, supported architectures, and OCI/Docker setup.
- [Google nsjail](https://github.com/google/nsjail) — Linux namespaces,
  seccomp-BPF, cgroups, filesystem and resource-limit features.
- [Judge0 API](https://ce.judge0.com/), [deployment notes](https://github.com/judge0/judge0/blob/master/CHANGELOG.md),
  and [pricing](https://judge0.com/#pricing) — hosted API, self-hosting
  requirements, documented Linux focus, and currently advertised managed plan.
- [Windows Sandbox](https://learn.microsoft.com/en-us/windows/security/application-security/application-isolation/windows-sandbox/)
  and [Windows Job Objects](https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects)
  — disposable VM networking/edition limitations and process-tree controls.
- [Docker Desktop WSL 2 backend](https://docs.docker.com/desktop/features/wsl/)
  — WSL2 prerequisites for Linux container workflows on Windows.
