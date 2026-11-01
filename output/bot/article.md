---
title: "Grok Bot + Opus 5.5: Build a 24/7 AI Engineering Team in 12 Steps"
author: "Mori (@0xjmori)"
source: "https://x.com/0xjmori/status/2109648700897116554"
article_url: "https://x.com/0xjmori/article/2109648700897116554"
published: "2026-10-12T14:13:40Z"
read_time: "11 min"
cover: "https://pbs.twimg.com/media/HUbz6qjXgAAp8MK?format=jpg&name=large"
fetched: "2026-10-28"
---

# Grok Bot + Opus 5.5: Build a 24/7 AI Engineering Team in 12 Steps

**Mori** (@0xjmori) · 11 min read · published 2026-10-12
Source: [x.com/0xjmori/status/2109648700897116554](https://x.com/0xjmori/status/2109648700897116554)

![Article cover](https://pbs.twimg.com/media/HUbz6qjXgAAp8MK?format=jpg&name=large)

One Chief, four specialists, Cursor cloud agents, shared memory, automated testing and a review loop that keeps working while your laptop is closed.

Most people are going to use the Grok Bot + Opus 5.5 upgrade wrong.

They will create one Bot, ask it to build an app, watch it write code for twenty minutes and call that an autonomous AI engineer.

The interesting part isn't having another chatbot that can code.

It's building a team that can receive a GitHub issue at midnight, reproduce the bug, delegate the fix, test the result, review the code and leave a pull request waiting for you in the morning.

On October 7, Elon Musk announced that Grok Bot would use the best backend model for each task, including Claude Opus 5.5.

![Elon Musk announcement about Grok Bot model routing](https://pbs.twimg.com/media/HUb5A_MWsAAYdUW?format=jpg&name=large)

That changes the architecture.

Grok Bot brings the computer, browser, terminal, persistent context, tools and routines. Opus 5.5 adds powerful reasoning capability to a system that can keep working after you close your laptop.

And Cursor cloud agents can handle coding tasks on separate machines.

There is one important limitation: Grok Bot manages model selection automatically. You cannot force every request to use Opus 5.5, and the platform does not expose a per-request model picker.

So the smarter way to build this is not to rely on a specific model being selected. It is to build a system that works regardless of which backend handles the task.

This is the full 12-step setup.

By the end, you'll have one Chief coordinating four specialists, a shared task ledger, reusable skills, automated checks, recovery rules and a workflow that turns GitHub issues into reviewed pull requests.

Not merged code. Not production deployments.

Review-ready work, with evidence.

**I publish practical guides to AI agents, automation and engineering workflows on [Substack](https://substack.com/@lunarresearcher).**

---

## 1. Understand what Opus 5.5 changes

The October 7 announcement sounds like a model update, but the important change is the separation between the agent's reasoning and the environment it operates.

Grok Bot already has the infrastructure for persistent work. It can use a cloud computer, interact with applications, preserve files and browser sessions, and hand tasks between named Bots.

Opus 5.5 becomes one of the reasoning backends available to that system.

![Diagram of Grok Bot as routing layer over reasoning backends](https://pbs.twimg.com/media/HUb5GwBXAAAOIlZ?format=jpg&name=large)

You do not need to configure a separate Claude subscription inside Grok Bot or add an Opus API key to make its automatic routing work.

The setup is simpler than that.

```text
                    YOU
                     |
                     v
                 GROK BOT
                     |
          +----------+----------+
          |                     |
          v                     v
      AI REASONING          EXECUTION
          |                     |
    Claude Opus 5.5         Cloud computer
    Other models            Browser
    Model routing           Terminal
                            Connected apps
          |                     |
          +----------+----------+
                     |
                     v
               FINISHED WORK
```

The model routing is managed by the platform. Grok Bot's documentation does not guarantee that a specific backend will serve every request.

This actually makes the operating system around the model more important.

A good agent should be able to inherit a task, read the project state, understand its permissions and continue toward the same acceptance criteria even if the underlying model changes.

The model is responsible for reasoning.

The workflow is responsible for making reasoning useful.

---

## 2. Understand the computer you're working with

Before creating five Bots, understand the environment they share.

Every Bot on your Grok Bot account uses the same persistent cloud computer. The files, browser sessions and command-line credentials are shared.

Bots can use different screens and separate conversations, but they are not separate security environments.

That is useful for collaboration. It also means two Bots can interfere with each other if they work on the same files without a clear ownership system.

![Diagram of the shared Grok Bot cloud computer](https://pbs.twimg.com/media/HUb5Km6XoAAF8Tn?format=jpg&name=large)

Cursor cloud agents are different. They can run coding tasks in separate cloud development environments.

For our engineering team, we will use both.

```text
GROK BOT CLOUD COMPUTER
        |
        |-- Chief
        |-- Triage
        |-- Builder
        |-- Reviewer
        |-- Release
        |
        |-- Shared task files
        |-- Shared working context
        |-- Shared browser sessions
        |
        v
CURSOR CLOUD AGENTS
        |
        |-- Isolated coding task A
        |-- Isolated coding task B
        |-- Isolated coding task C
        |
        v
SEPARATE BRANCHES + DRAFT PRs
```

The cloud computer keeps the operation moving. Cursor cloud agents can handle appropriate independent coding jobs without fighting over one working directory.

Do not assume your Grok Bot computer has a GPU or a fixed amount of RAM. Inspect the actual machine before designing resource-heavy workflows.

**Prompt 1. Check the environment**

```bash
# Ask Grok Bot to run these commands
# on its cloud computer.

echo "CPU:"
nproc

echo "MEMORY:"
free -h

echo "DISK:"
df -h /workspace

echo "OS:"
cat /etc/os-release | head -5

echo "GIT:"
git --version
```

Save important project files in /workspace, which is the documented shared workspace. Keep an external copy of critical results and use Git for durable code history.

---

## 3. BUILD THE TEAM

### Choose one workflow before creating the roster

We are building an autonomous engineering team, but the first assignment should be small enough to check.

Start with this:

**Given one labeled GitHub bug, reproduce it, prepare a fix on a separate branch, verify the change and open a draft PR.**

That is the whole first workflow.

Do not start with "maintain my entire repository." Do not give the team production deployment permissions. Do not activate unattended execution before the first manual test passes.

![Diagram of the first workflow: one issue to one draft PR](https://pbs.twimg.com/media/HUb5R7iW8AAiqU8?format=jpg&name=large)

The goal needs a measurable finish line.

**Prompt 2. Define the mission**

```text
MISSION: Automated Bug Resolution

Input:
One GitHub issue with the label "agent-ready".

Expected result:
A draft pull request containing the fix.

Required evidence:
- The original bug is reproduced.
- A failing test demonstrates the bug.
- The fix passes the relevant tests.
- The changed files are documented.
- Remaining risks are listed.
- A Reviewer independently checks the result.

Approval boundary:
Never merge.
Never deploy.
Never push directly to the default branch.

Stop and ask if:
- The issue cannot be reproduced.
- Requirements are ambiguous.
- Authentication or billing code is affected.
- A database migration is required.
- Tests remain unexplained or failing.
```

This is what makes the assignment executable.

Without a definition of done, the agent can write some plausible code and report success.

With one, it has to produce a result that can be inspected.

### Create the shared workspace

The team needs one place where work survives individual conversations.

Create a workspace with separate folders for incoming tasks, active issues, reviews and completed deliverables.

**Prompt 3. Bootstrap the engineering workspace**

```bash
mkdir -p /workspace/devdesk/{queue,issues,reviews,approved,logs}

cat > /workspace/devdesk/README.md <<'EOF'
# AI Engineering Desk

Goal:
Turn approved GitHub issues into reviewed
draft pull requests.

Rules:
- One owner per issue.
- Every issue has a current state.
- Coding happens on separate branches.
- Review evidence must be recorded.
- Never merge or deploy automatically.
- Escalate ambiguous or sensitive changes.

Directories:
queue/     New work
issues/    Active issue records
reviews/   Independent reviews
approved/  Human-approved handoffs
logs/      Run history
EOF

echo "Engineering workspace ready"
```

This is a workspace convention we are creating, not a special Grok Bot file format.

It gives every Bot a predictable location for artifacts and state.

A model can forget an earlier conversation. It should not need to guess where the failing test, PR link or review report was saved.

### Create the Chief and four specialists

Now build the roster.

![Image of the five-Bot roster](https://pbs.twimg.com/media/HUb5Vp4WwAABM1V?format=jpg&name=large)

You need five Bots, but not five Bots doing the same job.

```text
Bot	Responsibility
Chief	Owns the final outcome and coordinates work
Triage	Reproduces and classifies bugs
Builder	Coordinates the code fix and Cursor cloud agents
Reviewer	Independently verifies the change
Release	Prepares the approved handoff and reports status
```

The Chief is the only Bot you need to message for normal work.

It should know which issue is active, who owns the next step, which artifacts exist and what is blocking completion.

**Prompt 4. Chief**

```text
You are Chief, the manager of my AI engineering
team in /workspace/devdesk.

You own each issue from intake to a review-ready
draft pull request.

Your job is to:
- Assign each stage to one specialist.
- Keep the issue ledger current.
- Prevent duplicate assignments.
- Track blockers and failed attempts.
- Check that required evidence exists.
- Report completed work and pending approvals.

Do not write production code yourself.

Never mark an issue complete solely because
a specialist says it is complete.

Never authorize merging or deployment.

Remember this role.
```

**Prompt 5. Triage**

```text
You are Triage.

You investigate incoming GitHub issues and
produce reproducible bug reports.

For every issue:
1. Read the report and related code.
2. Identify the expected behavior.
3. Reproduce the observed failure.
4. Capture logs or screenshots.
5. Write a focused failing test when possible.
6. Save the reproduction evidence.

Do not guess the cause when the evidence
does not support it.

Never modify production systems.

Return the issue ID, reproduction steps,
test result and suspected scope.

Remember this role.
```

**Prompt 6. Builder**

```text
You are Builder.

You own implementation for issues that
Triage has successfully reproduced.

Use Cursor cloud agents when available
and appropriate for the task.

For every assignment:
1. Read the reproduction evidence.
2. Identify the smallest safe fix.
3. Work on a separate branch.
4. Preserve the failing regression test.
5. Run relevant tests after the change.
6. Open or prepare a draft pull request.
7. Return the diff, test output and risks.

Never push to the default branch.
Never merge.
Never deploy.

Remember this role.
```

**Prompt 7. Reviewer**

```text
You are Reviewer.

You independently review changes produced
by Builder.

You do not approve work based on a summary.

Inspect:
- The original issue
- The reproduction evidence
- The actual code diff
- The test results
- Relevant edge cases
- Security and regression risks

For every blocking problem, return:
- File and line
- Why it is wrong
- Evidence
- Required correction

Do not modify the implementation yourself.

Remember this role.
```

**Prompt 8. Release**

```text
You are Release.

You prepare reviewed engineering work for
human approval.

Only accept issues that have:
- A draft pull request
- Passing required checks
- A completed independent review
- No unresolved blocking findings

Prepare a final handoff with:
- Issue link
- PR link
- What changed
- What was tested
- Known risks
- Actions awaiting approval

Never merge or deploy.

Remember this role.
```

The team now has separate responsibilities.

The next step is making those responsibilities enforceable.

---

## 4. MAKE THE SYSTEM RELIABLE

### Turn the workflow into a state machine

A group chat is useful for collaboration, but it should not be the source of truth.

The source of truth should be the issue record.

![Diagram of the issue state machine](https://pbs.twimg.com/media/HUb5ZRxXcAAZEaB?format=jpg&name=large)

Every issue moves through known states, and every transition needs an artifact.

```text
NEW
 |
 v
TRIAGED
 |
 v
REPRODUCED
 |
 v
BUILDING
 |
 v
TESTED
 |
 v
REVIEWING
 |
 +------ FAILED ------> BUILDING
 |
 v
REVIEW_PASSED
 |
 v
DRAFT_PR_READY
 |
 v
HUMAN_APPROVAL
```

Create a state contract and store it in the workspace.

**Prompt 9. Save the state rules**

```text
Create /workspace/devdesk/STATES.md
with the following rules.

Every issue has its own folder:
issues/<issue-id>/

Every issue must contain:
- task.md
- status.json
- evidence/
- implementation.md
- review.md
- handoff.md

Allowed states:
NEW
TRIAGED
REPRODUCED
BUILDING
TESTED
REVIEWING
FAILED
REVIEW_PASSED
DRAFT_PR_READY
BLOCKED

Rules:
- Triage owns NEW through REPRODUCED.
- Builder owns BUILDING and TESTED.
- Reviewer owns REVIEWING and REVIEW_PASSED.
- Chief coordinates state transitions.
- Release owns the final handoff.

Never advance a state without the
required evidence.

Never mark REVIEW_PASSED unless
Reviewer has explicitly accepted the diff.

Never mark DRAFT_PR_READY unless
the draft PR exists and required checks pass.

Record failed transitions and blockers.
```

These are workflow rules, not a guarantee of enforcement by themselves. The Bots must follow them, and important transitions should be backed by scripts, repository checks or approval controls.

The important part is that every Bot can inspect the current state without asking the previous Bot to retell the conversation.

### Connect GitHub and Cursor cloud agents

This is where the architecture becomes more interesting.

Grok Bot can coordinate the work, while Cursor cloud agents can perform coding tasks in separate environments.

Before enabling delegation, connect the repository to Cursor Cloud Agents and configure its environment so dependencies, tests and required development services are available.

Do not assume cloud agents can use your Grok Bot computer's files or credentials. Their execution environments are separate.

For the first issue, let Triage reproduce the bug and create a failing test before Builder delegates the fix.

![Diagram of delegation from Builder to Cursor cloud agents](https://pbs.twimg.com/media/HUb5c88XcAA40kQ?format=jpg&name=large)

Then send Builder the implementation contract.

**Prompt 10. Delegate the fix**

```text
Issue: [GitHub issue URL]

Use the reproduction evidence saved by Triage.

If Cursor cloud-agent delegation is available
for this repository, start one coding agent
for this issue.

Otherwise, report the missing integration
instead of inventing a successful delegation.

Requirements:
- Use a new branch.
- Preserve the failing regression test.
- Fix only the issue's defined scope.
- Run relevant tests.
- Record all changed files.
- Prepare a draft PR.

Do not start multiple agents on the same
issue unless the work can be separated safely.

Return:
- Branch
- PR URL, if created
- Test results
- Changed files
- Remaining risks
```

This avoids a common problem with parallel coding agents: several workers touching the same files and creating conflicting changes.

Parallelize only independent tasks.

One agent can work on a backend bug while another handles an unrelated frontend issue. Sending three agents to rewrite the same function is usually a coordination problem disguised as productivity.

### Give the Reviewer evidence, not a success message

Builder finishes the change.

What happens next?

In a weak setup, it sends:

"Fixed. Tests pass."

Chief accepts it. Release prepares the handoff. The issue appears complete.

But nobody has checked whether the test actually covered the original failure.

The stronger setup requires an independent review artifact.

**Prompt 11. Review the pull request**

```text
Review this draft PR against its original
GitHub issue:

[PR URL]

Read the original issue and Triage's
reproduction evidence before the diff.

Check:
1. Does the fix address the reported bug?
2. Does the regression test fail before
   the fix and pass after it?
3. Were unrelated files changed?
4. Are there obvious edge cases?
5. Are the reported test results supported
   by actual execution logs?
6. Does the change introduce security
   or compatibility risks?

Return one of:

PASS
FAIL
BLOCKED

For FAIL, give exact file locations
and reproducible evidence.

For BLOCKED, explain which evidence
or permission is missing.

Do not modify the code yourself.
```

The Reviewer should be trying to find a reason to reject the work.

A second agent repeating the first agent's summary is not verification.

A reviewer that opens the diff, runs or inspects the tests and connects findings to the original requirements is.

The system should not treat a passing test suite as absolute proof either. Tests can be incomplete. A difficult change may require additional integration, security or human review.

### Put permissions outside the prompts

A stronger reasoning model does not need broader authority.

In fact, better agents make clear approval boundaries more important because they can get further into a workflow before stopping.

For this engineering team, routine reversible development work can proceed automatically inside its authorized workspace.

External or consequential actions require approval.

```text
AUTOMATIC

Read repository files
Inspect GitHub issues
Create reproduction reports
Run tests
Edit a working branch
Prepare draft PRs
Write review reports
Update task status

APPROVAL REQUIRED

Merge pull requests
Deploy to production
Modify live databases
Rotate credentials
Change billing or auth systems
Delete important data
Change repository permissions
```

These instructions should also be reflected in Grok Bot Auto-review settings, repository branch protection, CI checks and cloud-agent controls.

A prompt saying "never merge" is helpful. A protected default branch is stronger.

Grok Bot also shares credentials across Bots on the same user's computer. Giving one Bot a different name does not isolate its access.

For sensitive applications, use narrowly scoped integrations and separate environments where required. Complete login and 2FA steps through the secure handoff rather than pasting secrets into chat.

The goal is to automate preparation, not eliminate accountability.

---

## 5. TURN THE TEAM INTO A SYSTEM

### Save the process as a reusable skill

By this point, you have a working sequence:

Triage reproduces the bug, Builder prepares the fix, Reviewer checks it and Release creates the handoff.

![Diagram of saving the workflow as a reusable skill](https://pbs.twimg.com/media/HUb5gZqWQAA_k7r?format=jpg&name=large)

Do not rewrite that process for every issue.

Save it as a Grok Bot skill.

Skills preserve reusable procedures, decision rules, validation requirements and approval boundaries.

**Prompt 12. Create the engineering skill**

```text
Save our verified bug-resolution workflow
as a private skill named "resolve-bug".

Use the procedure demonstrated in the
completed issue.

The skill must include:

WHEN TO USE
A GitHub issue has been approved for
automated bug resolution.

INPUT
Issue URL
Repository
Acceptance criteria

PROCESS
1. Triage and reproduce
2. Save failing test
3. Delegate implementation
4. Run relevant checks
5. Independently review
6. Repair blocking findings
7. Prepare draft PR
8. Return final handoff

LIMITS
- Never merge or deploy
- Maximum two repair rounds
- Stop on unexplained test failures
- Escalate auth, billing and migrations
- Do not duplicate active issue work

OUTPUT
Issue status
Draft PR
Tests and evidence
Review report
Outstanding approvals
```

A skill is the method. It is not the schedule.

That distinction matters because you want to be able to invoke the exact same procedure manually, from a GitHub event or as part of a larger engineering routine.

Run the skill on another harmless issue before automating it.

If the second run fails in the same way as the first, improve the procedure or add a mechanical check.

### Add a routine that runs while you sleep

Now the workflow is ready for background operation.

Grok Bot supports scheduled routines and supported event triggers, including GitHub-related events through connected integrations.

Keep the trigger narrow. You do not want every comment on every issue to wake up five Bots.

For the first unattended setup, use the agent-ready label and a small limit on new issues.

**Prompt 13. Create the night shift**

```text
Create a routine called "Engineering Night Shift".

Owner:
Chief

Schedule:
Every night at 11:00 PM in my configured
Grok Bot timezone.

Input:
GitHub issues labeled "agent-ready"
in repository [owner/repo].

Workflow:
1. Find up to two eligible issues.
2. Skip issues already active in the ledger.
3. Run the resolve-bug skill on each issue.
4. Use separate branches and cloud agents
   when delegation is available.
5. Require independent review.
6. Prepare draft PRs only.

Stop conditions:
- Missing repository access
- Unreproducible issue
- Repeated repair failure
- Unresolved blocking review findings
- Sensitive change requiring approval
- Usage or execution limit reached

Output:
One morning report listing:
- Completed draft PRs
- Issues still in progress
- Blocked issues
- Failed tests
- Approval requests

Never merge or deploy automatically.
```

Test this routine with a harmless issue before allowing it to run unattended.

A Grok Bot test run performs real work, including tool calls and potentially file modifications. Use safe test inputs and enforce the same approval boundaries as production.

There is another important limit: a scheduled routine is not an unlimited continuous process. Usage allowances, failures, computer recovery and pauses can interrupt work.

The point of persistent state is that the next run knows where to continue.

### Make the system recover and report honestly

The most valuable engineering agent is not the one that never fails.

It is the one that fails in a way you can inspect and recover.

Imagine Triage successfully reproduces a bug. Builder creates a fix. Tests fail. Builder tries again, but the same test fails for the same reason.

![Diagram of failure recovery paths](https://pbs.twimg.com/media/HUb5kd3WcAAH6Ts?format=jpg&name=large)

Without a limit, the team can burn time and usage indefinitely.

Give failures explicit recovery paths.

```text
TOOL TIMEOUT
Check whether the previous action completed.
Retry only if needed.

MISSING DEPENDENCY
Restore the documented environment.
Retry once.

TEST FAILURE
Inspect the failing test.
Change the implementation, not the result.

REVIEW FAILURE
Return findings to Builder.
Allow one additional repair round.

SAME FAILURE TWICE
Stop and escalate.

MISSING PERMISSION
Request approval or report blocked.

UNREPRODUCIBLE ISSUE
Do not invent a fix.
Return the reproduction report.
```

The morning report should distinguish completed work from attempted work.

**Prompt 14. Generate the morning handoff**

```text
Review all engineering work completed
since the previous morning report.

For every issue, return:

ISSUE
GitHub URL

OWNER
Current responsible Bot

STATUS
Current state from the ledger

ARTIFACT
Draft PR URL or saved evidence

VERIFICATION
Tests run and their actual results

REVIEW
PASS, FAIL or BLOCKED

NEXT ACTION
One specific action required

APPROVAL
Anything waiting on me

Do not call an issue completed unless
its acceptance requirements are met.

List all unresolved work separately.

End with:
- Draft PRs ready for human review
- Blocked issues
- Failed or repeated attempts
- Suggested improvements to the workflow
```

That report is the product of the night shift.

You should be able to open it in the morning, inspect the PRs and decide what to approve without reconstructing hours of Bot conversations.

---

## 6. WHAT BREAKS

A system like this is useful, but the first version will encounter problems.

The model changes. Grok Bot manages model routing, and the model that serves a task is not guaranteed. Keep your task contracts and validation rules independent of a specific model. If a stage requires guaranteed Opus 5.5 execution, use a separately configured Claude API or Claude Code workflow.

Two Bots work on the same issue. Give each issue a unique ID and one current owner. Check the ledger before dispatch. Keep coding branches separate and do not share mutable working files without coordination.

The cloud computer is rebuilt. Project files in /workspace are designed to persist through normal updates, but installed packages may need to be restored and very recent changes may be lost during recovery. Keep setup commands reproducible, and preserve code changes in Git.

The review loop never ends. Limit repair rounds and ask for help when the same failure repeats. A failed test is evidence, not an invitation to edit the test until it turns green.

Usage runs out. Grok Bot has plan-based usage and optional additional spending controls. Cursor's current documentation says underlying model selection does not change the usage charge per token. Measure the cost of completed workflows rather than assuming that every issue takes the same amount of compute.

Sensitive data crosses a boundary. Both the shared computer and model-provider routing matter. Review connected accounts, credentials, source-code sensitivity and organizational data policies before delegating work.

Do not enable all of these moving parts at once.

Start with one safe bug.

Then one successful handoff.

![Diagram: start with one safe bug, then one successful handoff](https://pbs.twimg.com/media/HUb5n8IWoAAmE1C?format=jpg&name=large)

Then one independently reviewed fix.

Then one reusable skill.

Only after that should you activate the night shift.

---

## THE FIRST RUN

You do not need twelve days to start.

Open Grok Bot, create Chief and paste this:

```text
We are building an AI engineering team
using the workspace /workspace/devdesk.

Start with one GitHub issue.

Create the workspace structure and
task ledger described in our setup.

Then tell me which integrations,
permissions and specialist Bots are
missing before we can proceed.

Do not create cloud agents yet.
Do not change production code.
Do not enable routines.

I want one successfully reproduced bug,
one safe implementation attempt,
one independent review and one
review-ready draft PR.

Show me the evidence at every stage.
```

When the first issue reaches a clean draft PR, the next step is obvious.

Save the process.

Run it again.

Fix whatever made the second run difficult.

Then automate the version that actually worked.

---

## THE REAL SHIFT

Opus 5.5 makes the Grok Bot story much more interesting, but the model alone is not the product.

Grok Bot provides the persistent work environment. Cursor cloud agents provide independent coding environments. Skills preserve procedures. Routines start the work. Reviewers check the result. Approval controls decide what the system can do without you.

Together, those components can turn a GitHub issue into a review-ready change without requiring you to manually route every step.

The value is not that five Bots are running.

The value is that you can stop watching them.

You define the outcome, the boundaries and the evidence required for completion. The team handles the reversible work and returns when a meaningful decision needs you.

The strongest AI engineering team is not the one that writes the most code overnight. It is the one that leaves you the least uncertain about what happened.

That is the system worth building.

---

**Bookmark this guide before creating another agent with no owner, no task state and no definition of done.**

Follow me on X: [x.com/0xjmori](https://x.com/0xjmori)

Subscribe to my Substack: [substack.com/@lunarresearcher](https://substack.com/@lunarresearcher)

Let the Bots do the work. Keep the merge button.

---

## Sources and verification

For implementation details, the key references are [Grok Bot's working guide](https://prod.cursor.com/docs/grok-bot/work), [Cursor Cloud Agents](https://prod.cursor.com/docs/cloud-agent) and [Grok Bot model selection](https://prod.cursor.com/help/grok-bot/models).

The official documentation confirms the shared computer, Bots, skills, routines and cloud-agent workflow. It also clarifies that users cannot choose or inspect the underlying model for individual Grok Bot requests.
