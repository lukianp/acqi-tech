---
title: "Air-gapped discovery: carrying evidence across the boundary"
description: "When the target estate cannot reach the internet, the collection model changes. Here is what has to be designed."
updated: "2026-11-10"
order: 8
topic: "Architecture"
---

Some estates cannot be read from outside. Defence, critical national infrastructure, regulated
manufacturing and a surprising number of mid-market environments run collections that have no
outbound path, no shared identity provider and no route for a vendor's tool to call home.

Discovery is still possible. It just has to be designed as a transfer problem rather than a
connectivity problem.

## The shape of an air-gapped collection

**1. Collect inside.** The collector runs inside the boundary, against the same read-only
credentials, and writes an evidence package. Nothing leaves during collection.

**2. Package and sign.** The evidence package is signed at the point of collection so that the
receiving side can prove it was not altered in transit. The signature must cover the payload and
the metadata separately, because the metadata is what the receiving side uses to decide whether to
trust the payload.

**3. Transfer by an approved route.** Removable media, a data diode, a one-way file drop, or a
human carrying a laptop through a door. The route is a customer decision and is usually governed
by a policy that predates the project.

**4. Ingest outside.** The receiving installation validates the signature, records the chain of
custody, and loads the evidence into the estate record. The timestamp of collection is preserved,
not the timestamp of ingest.

**5. Return nothing.** In the strictest environments, the direction is one way. The analysis
happens on the outside and the findings travel back as a document, not as a system change.

## What has to be true for this to work

**The package format must be documented.** An opaque blob that only the vendor's tool can read is
not acceptable in an environment where the receiving side has to inspect what crosses the
boundary. Publish the schema.

**Runs must be reproducible.** If the collection is a one-shot event, a failed transfer means
re-running inside the boundary, which may take weeks to schedule. Design for re-export from stored
evidence rather than re-collection.

**Time must be handled explicitly.** Air-gapped evidence is always stale. The record must show
collection time, transfer time and ingest time, and any analysis must state which one it used.

**Custody must be recorded.** Who collected, who signed, who carried, who ingested. This is the
part that auditors ask about and the part most tools omit.

## The mistakes to avoid

**Treating the air gap as an export feature.** It is an architecture. If the product assumes a
live connection for licensing, updates, identity or telemetry, the air gap breaks it in four
places at once. Every one of those dependencies needs an offline path, documented and tested.

**Underestimating the schedule.** A transfer that requires a change to a media-handling policy can
take longer than the collection itself. Ask about the route in week one, not week six.

**Assuming one gap.** Large organisations often have several boundaries with different rules. The
corporate network, the operational technology network and the research network may each require a
different route and a different approval. Map them separately.

## A question worth asking early

**What is the approved route for data leaving this environment, and who approves it?**

If the answer takes more than a week to obtain, the programme has a dependency that is not in the
plan. Put it in the plan, with an owner, before the first collector runs.
