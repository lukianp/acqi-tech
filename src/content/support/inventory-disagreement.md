---
title: "Why two inventories of the same estate never agree"
description: "The disagreements are not errors to be smoothed away. They are the most useful part of the review."
updated: "2026-11-10"
order: 3
topic: "Consolidation"
---

Collect the same estate twice, from two different sources, and you will get two answers. The
instinct is to reconcile them into one clean number. That instinct throws away the most useful
output of the exercise.

## Four reasons sources disagree

**Different questions.** An HR system counts people on payroll. A directory counts identities with
a mailbox. A device management tool counts enrolled devices. None of these is the number of
employees, and all of them will be quoted as if it were.

**Different clocks.** One source refreshes hourly, another nightly, another when a human updates
it. Comparing them at a single instant compares two different moments.

**Different definitions.** A "site" in the network inventory is a physical location with a router.
A "site" in the facilities system is a lease. A "site" in the directory is an object with a
subnet. Three tables, three meanings, one column heading.

**Different boundaries.** Contractors in the directory, absent from payroll. Service accounts in
the identity store, absent from HR. Shared mailboxes counted by one tool and not another.

## What to do instead of reconciling

Record both readings. Keep the source, the timestamp and the collector. Show the difference. Then
route the difference to a person with the authority to decide which reading is right for the
programme's purpose.

This is slower than averaging. It is also the only approach that produces a record you can defend
eighteen months later when someone asks why the migration plan assumed 4,100 mailboxes when the
invoice says 4,800.

## The three states worth distinguishing

Every consolidated entity should carry one of three states, and the interface should make them
visible rather than hiding them behind a single confident number.

**Agreed.** Two or more sources agree, or one authoritative source exists and is documented as
authoritative for this attribute. Safe to plan against.

**Conflicted.** Sources disagree and nobody has decided. Not safe to plan against, and the
conflict needs an owner and a date.

**Unreadable.** A source exists but could not be read, or a scope was excluded. The programme must
carry an explicit assumption here rather than a silent zero.

A record that shows only the first state is a record that has hidden its own uncertainty.

## The practical consequence for a migration plan

Wave sizing reads the record. If conflicted and unreadable entities are collapsed into a single
number, the plan is built on a figure nobody can reproduce. The first wave then either
over-runs, because it meets entities the plan did not count, or under-runs, because it migrates
duplicates.

Neither failure is visible until cut-over week. By then the conflict that caused it is buried in a
tab nobody reopened.

## A rule to adopt

No silent resolution. If the product, the spreadsheet or the process resolves a disagreement
without recording that it did so, it has created a fact that cannot be audited. Recording the
resolution takes a sentence. Reconstructing it later takes a week.

Write the decision, name the decider, date it. Then move on.
