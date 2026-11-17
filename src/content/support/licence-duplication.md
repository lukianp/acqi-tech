---
title: "Where licence duplication hides after an acquisition"
description: "Four places the money goes, why the finance view misses them, and what to collect before the renewal date."
updated: "2026-11-10"
order: 6
topic: "Commercial"
---

Every acquisition creates duplicate licences. The savings are real, they are usually larger than
the synergy model says, and they are almost always found too late to affect the renewal that
matters.

The reason is structural. Licence position lives in three places that do not talk to each other:
the contract, the entitlement record and the actual consumption. Each is owned by a different team
and each disagrees with the others.

## Where the duplication sits

**1. The same product bought twice.** Both organisations hold the same platform under different
agreements, with different renewal dates and different discount structures. The product is not
duplicated in use, only in contract. Consolidating at renewal is straightforward if you know both
dates, and impossible if you find out three weeks after one auto-renewed.

**2. Entitlement without consumption.** Seats bought for a project that ended. Licences assigned
to leavers whose accounts were disabled but not deprovisioned. Capacity reserved for a workload
that moved. This is the largest category in most estates and the easiest to fix, provided the
assignment data is current.

**3. Consumption without entitlement.** The mirror image, and the one that creates audit exposure.
Shadow usage, developer keys in production, and workloads running on a licence that does not cover
them. Finance sees a bill; nobody sees the compliance gap until a vendor asks.

**4. Duplicated function across vendors.** Two endpoint tools, two backup products, two
observability platforms. Nobody duplicates a product on purpose. It happens because each
organisation had a reason, and after close both reasons still sound reasonable to their respective
owners.

## Why the finance view misses it

The finance view is organised by cost centre and vendor. Duplication is organised by function and
by assignment. A single vendor line can hide three overlapping tools. A single function can be
split across nine cost centres.

Neither view can see assignment data, which is the only place where "bought" and "used" can be
compared.

## What to collect before the renewal date

- **Contract register**: vendor, product, quantity, unit, start, end, auto-renewal terms, notice
  period, termination rights on change of control.
- **Entitlement register**: what the contract says you may use, in the vendor's own units.
- **Consumption record**: what is actually assigned and active, per product, with a timestamp.
- **Assignment detail**: which identity holds which licence, and whether that identity is still
  active in the directory.

The fourth item is the one that turns a licence review into a savings programme. Without it, the
comparison is between a contract and an invoice.

## Sequence the work to the calendar

Licence optimisation is a calendar problem more than an analysis problem. The value is realised at
renewal, and renewal dates are fixed.

Build the register, then sort by notice period. The product renewing in eight weeks is the only
one worth working on today. The product renewing in fourteen months can wait, and saying so
explicitly stops the team from boiling the ocean.

## One caution

Do not cancel a licence because consumption is low. Cancel because consumption is low **and** the
remaining users have somewhere to go. A licence reduction that forces a migration in the same
quarter is a false saving, and the programme that inherits it will not thank you.
