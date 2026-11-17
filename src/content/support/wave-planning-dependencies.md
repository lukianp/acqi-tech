---
title: "Plan migration waves by dependency, not by department"
description: "Departmental waves look tidy on a slide and fail in cut-over. A dependency-first sequence is uglier and survives."
updated: "2026-11-10"
order: 4
topic: "Migration"
---

The first draft of almost every migration plan is organised by department. Finance goes first
because finance is small. Then HR, then operations, then engineering last because engineering
complains the loudest.

Departmental waves are popular because they are easy to explain to people who are not doing the
work. They also fail for a structural reason: departments share dependencies, and a dependency cut
in half breaks both halves.

## What actually constrains a wave

**Identity.** Everything authenticates. Until a user, group or service principal exists in the
target with a resolvable identity, nothing downstream can be tested. Identity is almost always
wave zero, and it is almost never finished when the plan says it is.

**Mail flow and directory dependencies.** Distribution lists, shared mailboxes, calendar
delegation, SMTP relays and application mail senders form a graph. Cut a node in the middle and
mail disappears silently, which is worse than failing loudly.

**Application coupling.** An application has an owner in one department and a database
administrator in another. Moving the front end without the data tier produces a working login and
a broken screen.

**Network and site.** A device cannot be re-enrolled before its subnet, proxy and certificate
trust are in place. Site-level prerequisites are physical and slow, and they set the real
timetable.

**Vendor and contract.** Some workloads cannot move before a contract change, a licence
assignment or a third-party maintenance window. These lead times are weeks, not hours, and they
belong in the plan as constraints rather than surprises.

## How to build the sequence

Start from the dependency graph, not from the org chart.

1. List the workloads to move.
2. For each, list what must be true before it can move: identity, network, data, contract,
   application dependency.
3. Draw the edges. Anything with an edge to another workload cannot move in an earlier wave
   unless the dependency is satisfied another way.
4. Group by readiness date, not by department.
5. Name each wave after its constraint, not its business unit. "Wave 2: identity-dependent
   workloads with no vendor lead time" is honest. "Wave 2: Finance" hides the constraint.

The result cuts across departments. Finance users appear in three waves. That is inconvenient for
communication and correct for delivery.

## Where departmental grouping is still right

Communication. People want to know when their work is affected, and "your department is spread
across waves two, four and six" is a harder message than "you are in wave two".

Handle it by separating the delivery sequence from the communication sequence. Publish a per-team
view of the waves that affect it, derived from the real plan. Do not bend the plan to make the
view simpler.

## The test of a wave plan

Ask of any wave: **what would break if we moved this half now?**

If the answer includes a workload in a later wave, the boundary is wrong. Move the boundary, not
the workload.

Ask also: **what has to be true before this wave can start, and who owns each item?**

If the list of prerequisites is empty, the wave was defined by convenience. Every real wave has at
least three things that must be true first, and at least one of them is late.
