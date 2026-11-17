---
title: "The 100-day estate journal: what to record after close"
description: "Integration memory fails faster than anyone expects. A short, disciplined journal is the cheapest control available."
updated: "2026-11-10"
order: 10
topic: "Operations"
---

Six months after close, nobody remembers why the finance file share was left in the source tenant.
The person who made the decision has left the programme, the ticket has been closed, and the
remaining cost is a monthly line item that everyone assumes someone else is handling.

A journal prevents this. Not a status report, not a steering deck. A dated record of decisions
about the estate, with an owner and a revisit date.

## What goes in

Only entries that would be expensive to reconstruct:

- **Decisions.** A workload kept in the source tenant, a tool retained, a contract extended, a
  decommission deferred. With the reason, the decider and the condition that would reverse it.
- **Deferrals.** Anything postponed, with the trigger that brings it back. "After the ERP
  migration" is a trigger. "Next quarter" is not.
- **Exceptions.** Systems that could not be migrated, identities that could not be resolved,
  integrations that were rebuilt by hand. With the workaround and who owns it.
- **Cost changes.** A licence retained, a duplicate cancelled, a new tool bought to bridge a gap.
  With the annualised number.
- **Risks accepted.** What was knowingly left in place, by whom, on what basis.

## What stays out

Status updates, meeting notes, RAG ratings and headcount. Those belong in the programme's own
reporting, which will be retired. The journal outlives the programme.

## The discipline

One page per entry. Four fields: date, decision, reason, revisit.

Keep it in the estate record, not in a document store. An entry that lives in a wiki nobody reads
is not a control. An entry attached to the workload it concerns is found by the next person who
touches that workload, which is the only moment it matters.

Review it at day 30, day 60 and day 100. At each review, close entries whose revisit date has
arrived and reopen anything whose condition has changed. Then keep reviewing monthly for the first
year, and quarterly after that.

## Why day 100

The first hundred days are when the programme still has authority, budget and attention. Decisions
taken in that window set the estate's shape for years, and they are taken quickly, under pressure,
by people who will not be there later.

The journal's job is to make those decisions legible to the people who inherit them. It is not
documentation for its own sake. It is the difference between a deferred decommission and a
forgotten one.

## A test for whether it is working

Pick a workload that was deferred in the first month. Ask three people, six months later, why.

If they give the same answer and can name the trigger that would restart it, the journal is
working. If they give three different answers, or none, the programme has already lost the
reasoning and will pay for it twice.
