---
title: "Designing a discovery credential that survives a security review"
description: "Read-only is a start, not a design. How to scope, name, time-box and evidence a credential before someone asks."
updated: "2026-11-10"
order: 2
topic: "Security"
---

The fastest way to lose three weeks in an integration programme is to request a discovery
credential informally. Someone grants global reader, the security team finds out, and the
programme stops while a review happens that could have been avoided by a page of design work.

Read-only is necessary and not sufficient. A read-only credential with tenant-wide scope can still
read every mailbox, every file and every identity in the organisation. The review will ask why it
needed that.

## Four properties to design for

**Minimum scope.** Scope to the workloads you will actually collect in this phase, and write down
why each scope is on the list. If a scope has no collector behind it, remove it. Reviewers are
reasonable people who object to unexplained breadth.

**Named purpose.** One credential per purpose, not one credential for the programme. A credential
called `acqi-discovery-m365-phase1` with a documented purpose is auditable. A credential called
`migration-admin` is a finding.

**Time box.** An expiry date, written into the request. Ninety days is usually enough for a
discovery phase. A credential without an expiry is a permanent grant that nobody revisits.

**Evidence.** The run log must record which credential read what, when. Without this, the answer to
"what did the tool see" is a guess, and the review escalates.

## The conversation to have first

Before you request anything, send the security team a short note containing four things:

1. What will be read, in workload terms.
2. What will not be read, explicitly. Mailbox content is the usual one to rule out early.
3. Where the output will be stored, in their environment, with which encryption keys.
4. When the credential will be revoked, and who revokes it.

This note takes twenty minutes to write and prevents the most common delay in the whole
programme. It also creates the artefact you will need again at the next customer.

## Common mistakes

**Requesting application permissions when delegated would do.** Application permissions act
without a signed-in user. If the collector can run as a named operator, delegated permissions are
easier to justify and easier to revoke.

**Granting write scope "for later".** Phase two can request phase two permissions. Carrying write
scope through a discovery phase means every reviewer has to consider the worst case rather than
the actual one.

**Using a personal account.** A discovery credential tied to an individual leaves with that
individual. Use a workload identity with a documented owner and an expiry.

**No revocation test.** Do not assume the credential will be revoked at the end. Put a date in the
plan, and check it happened. A programme that cannot demonstrate revocation has not finished.

## What good looks like at the end

At close of a discovery phase you should be able to produce, on request and in under five minutes:
the list of credentials used, their scopes, their creation and expiry dates, the runs each one
performed, and confirmation that each was revoked at the agreed time.

If that takes a day to assemble, the design was wrong. Build the register before the first run, not
after the first question.
