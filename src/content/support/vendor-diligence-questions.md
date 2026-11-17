---
title: "Ten questions to ask before a vendor reads your target's estate"
description: "A procurement checklist for installed discovery tools, written so that a wrong answer disqualifies rather than merely concerns."
updated: "2026-11-10"
order: 9
topic: "Procurement"
---

A tool that reads an estate during a live transaction is being trusted with the most sensitive
inventory in the deal. The questionnaire that usually accompanies that decision is a compliance
form. These ten questions are different: each has an answer that should stop the engagement.

## 1. Where does the data physically live?

The answer must name an environment the customer controls, with a region or a data centre. "In our
cloud, encrypted" is not an answer to this question.

## 2. Who can read it without the customer's involvement?

Look for standing vendor access, support tunnels and break-glass accounts. The acceptable answer is
none, with a documented process for time-boxed access that the customer grants and revokes.

## 3. What leaves the environment, on what schedule, and can it be turned off?

Licence checks and telemetry are fine. They must be enumerable, documented and disableable. If the
vendor cannot list the outbound calls, they do not know their own product.

## 4. What is the credential model, and what is the maximum scope the product will ask for?

Read-only is table stakes. The follow-up is whether the product enforces read-only or merely
prefers it. Ask for the failure behaviour when a credential carries write scope.

## 5. Can the product run air-gapped, and what breaks when it does?

Not "is it supported" but "what specifically stops working". Licensing, updates, identity and
telemetry are the four usual casualties. Each needs a documented offline path.

## 6. How is provenance recorded?

The vendor should be able to show a single field, trace it to a source system, a credential and a
timestamp, and demonstrate it in the product rather than in a slide.

## 7. What happens when two sources disagree?

The wrong answer is "we reconcile them". The right answer distinguishes agreed, conflicted and
unreadable, and leaves the decision with a named person.

## 8. How do we get our data out, in what format, and at what cost?

Ask for the schema. Ask whether export is included in the licence or sold as a module. A product
whose exit path is a paid feature has an exit price.

## 9. What does the vendor do when they find a vulnerability?

Look for a disclosure policy, an acknowledgement commitment and a security release process. A
vendor with no published contact for security reports has not thought about it.

## 10. What can the product not do today?

This is the question that separates a supplier from a salesperson. A good answer is specific,
names the limitation, and distinguishes planned from partial from absent.

## How to score the answers

Do not score out of ten. Sort the answers into three buckets:

- **Disqualifying.** Data outside the customer's control, standing vendor access, undisclosed
  outbound calls, no export path.
- **Material.** Air-gap limitations, scope enforcement, provenance quality. These shape the
  deployment plan and belong in the statement of work.
- **Informational.** Everything else.

A vendor who answers all ten plainly, including the uncomfortable ones, is easier to work with
than one who answers nine well and deflects the tenth. The tenth answer predicts the behaviour of
the relationship after signature.
