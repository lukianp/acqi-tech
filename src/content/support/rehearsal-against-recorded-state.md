---
title: "Rehearse the cut-over against recorded state, not a spreadsheet"
description: "A rehearsal that reads a plan tests the plan's grammar. A rehearsal that reads the estate tests whether it would have worked."
updated: "2026-11-10"
order: 5
topic: "Migration"
---

Cut-over rehearsals usually test the wrong thing. The team walks through the runbook, ticks each
step, and reports that the plan is sound. What they have demonstrated is that the runbook is
readable. They have not demonstrated that the estate would survive it.

## Two kinds of rehearsal

**A plan rehearsal** reads the runbook and asks whether each step is possible in principle. It
catches missing steps, wrong owners and unrealistic timings. It is cheap and worth doing.

**An estate rehearsal** reads the recorded estate and asks what each step would actually do to it.
It catches the things that break cut-overs: an identity mapping with no target, a distribution
list with a member who no longer exists, a site with no subnet in the target, a service account
whose credential expires during the window.

The second is the one that saves the weekend. The first is the one that usually happens.

## What an estate rehearsal needs

The rehearsal is only as good as the record it reads. To be worth running, the record must have:

- **Current entity state**, with the timestamp of the last successful read.
- **Mappings**, explicit and testable, for identity, domain, site, permission and application.
- **Dependency edges**, so the rehearsal can detect a step that runs before its prerequisite.
- **Known gaps**, marked as gaps rather than as empty values.

If any of these are missing, the rehearsal produces false confidence, which is worse than no
rehearsal. A plan that has never been tested is treated with caution. A plan that has been
"rehearsed" is treated as proven.

## The output that matters

An estate rehearsal should produce a list of findings, each with four fields:

1. The step that would fail.
2. The entity it would fail on.
3. The reason, traceable to the record.
4. What would need to change for it to succeed.

Findings should be resolvable: close the mapping, add the subnet, renew the credential, remove the
stale member. A rehearsal that produces a narrative rather than a worklist has not finished.

## Rehearse twice

Run once early, when the plan is still cheap to change. Expect a long finding list and treat it as
good news, because each finding is a failure that will not happen in production.

Run again in the week before cut-over, against a refreshed record. The second run should be short.
If it is not, either the estate has moved under the plan or the earlier findings were not actually
closed.

## What a rehearsal cannot tell you

It cannot tell you whether a business process will tolerate the change. It cannot tell you whether
the help desk will be overwhelmed on day one. It cannot tell you whether the vendor's support
engineer will answer the phone at 02:00.

Those are real risks, and they belong in the runbook as contingencies. But they are not
substitutes for the mechanical check. Do the mechanical check first. It is the part that is
knowable in advance.
