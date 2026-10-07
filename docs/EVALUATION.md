# BlindNav — Evaluation guide

Start with the smallest path that exercises the project. Distinguish source inspection,
syntax/build checks, functional behavior and domain validation when recording a result.

## Guided reading and demonstration

1. **Start from home.** Use the large start control. The root app changes its screen state and
initializes speech preferences.

2. **Grant permissions.** Evaluate camera and media behavior on a suitable device. Permission
refusal should be part of the review, not skipped as a setup nuisance.

3. **Listen to descriptions.** The active CameraScreenLive calls the generation session and
presents speech. Inspect response delay and failures without treating a generated scene as
verified ground truth.

4. **Exit and inspect services.** Leave the camera and examine speech/haptic cleanup. Compare the
active screen with the retained older camera implementation to avoid evaluating the wrong code
path.

## Declared checks

These commands/checks describe the intended verification path. Their presence in this
guide does not claim that they passed. See the dated evidence below and the README for setup.

```text
npx tsc --noEmit
```

## Evidence levels

| Level | What it establishes | What it does not establish |
| --- | --- | --- |
| Source review | A path exists in tracked code | Successful runtime behavior |
| Syntax/build | Parser/compiler accepts that path | End-to-end correctness |
| Behavioral check | A specific input/output case passed | Generalization beyond cases |
| Domain evaluation | Performance on a stated target setting | Other users/data/environments |

## What to record

- Commit, environment, dependency versions and date.
- Input provenance and whether data is synthetic, public or privately supplied.
- Absolute pass/fail/skip counts; keep failed cases and their root causes.
- Whether external services, hardware or a production deployment were actually exercised.
- Expected output and an artifact showing the observation.

## Review scenarios

- **Active screen is explicit:** App.tsx routes to CameraScreenLive, so that path governs current
behavior.

- **Feedback is separate from inference:** Speech/haptic services translate output into
interaction, but cannot certify the observation.

- **Public key variable:** EXPO_PUBLIC configuration reaches the application bundle; it is not a
protected backend secret.

## Documentation inspection — 7 October 2026

The documentation was traced to committed source and checked for local links, balanced
code fences and supported implementation claims. Historical notebook outputs remain labeled
as historical. Live provider access, private databases and hardware behavior are not inferred
from configuration or dependency files. Any fresh run is recorded separately in the README.

## Next evidence to collect

- Run supervised device and screen-reader evaluations.
- Measure response latency and error/unknown states.
- Design a secure provider boundary before distributing builds.
