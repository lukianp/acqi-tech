---
title: "Identity is the first workload you migrate and the last one you finish"
description: "Why the identity cut-over has no clean end date, and how to plan around that honestly."
updated: "2026-11-10"
order: 7
topic: "Migration"
---

Every migration plan puts identity in wave one. Almost none of them account for the fact that
identity is still being migrated in the final week, months later, in ones and twos, usually by
someone who has stopped calling it a migration.

## Why identity does not finish

Identity is not a workload. It is the substrate every other workload depends on. Migrating it
means establishing, for every principal in the estate:

- an object in the target directory,
- a credential or a federated trust,
- group and role membership that preserves access,
- a mail address and routing that preserves delivery,
- and an owner who knows the principal exists.

The first four are mechanical and can be batched. The fifth is not. Service accounts, shared
accounts, application identities and vendor accounts frequently have no living owner. They cannot
be decommissioned safely and they cannot be migrated correctly without knowing what depends on
them.

## The consequence for the plan

Treat identity as two phases with different completion criteria.

**Phase one: bulk identity.** Users, groups, mailboxes, standard service accounts with known
owners. This has a finish date and it is normally achievable. Define it as: every principal in
scope exists in the target, authenticates, receives mail, and has the access the source granted.

**Phase two: residual identity.** Unowned service accounts, legacy application identities,
federated trusts with third parties, and the long tail nobody inventoried. This does **not** have a
clean finish date. Define it instead as a managed queue with an owner, a weekly review, and a rule
that nothing is decommissioned until its dependants are known.

Pretending phase two will complete on a date is how programmes end up with a "closed" identity
workstream and a production incident six weeks later.

## What to collect early

Inventory the principals that have no owner before you migrate any of them. This is uncomfortable
work: it means asking teams who does not exist on any org chart, and accepting "we do not know" as
an answer for now.

The output is a residual register: principal, type, last activity, known dependants, current
custodian, proposed disposition. That register is the phase two queue.

## Access preservation is the hard part

A user who can log in but cannot open the file share has not been migrated. Access is the product
of group membership, delegation, permission inheritance and sometimes a local group on a server
nobody remembers configuring.

Test access by sample, per workload, before the wave closes. Pick five users per business unit and
have them do their actual job. Not a login test. The task they perform on a Tuesday.

## The day-one question

On the morning after cut-over, someone will ask: **can everyone work?**

If identity phase one is genuinely complete, the answer is mostly yes and the exceptions are
known. If it is not, the answer is a queue, and the queue is being worked by people who are also
handling the help desk.

Plan for the second case. Have the residual register open, have a named owner for it, and have
permission to spend the first week on exceptions rather than on the next wave.
