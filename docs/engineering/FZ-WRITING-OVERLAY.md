# FZ writing overlay

External guides are not copied into this repository.

Use the Google developer documentation style guide for English technical
pages, and the Microsoft Writing Style Guide when the Google guide is
silent. This page only records Forma Zieleni rules.

## Language

Owner and Agnieszka guides are Polish. Customer help, when a customer
surface exists, is Polish. Code identifiers stay as written in source.
Architecture Canon stays English, which is the language already used there.
Do not publish a second full translation of Canon.

Polish uses diacritics and normal sentence order. Do not label a page as
human-authored when an assistant drafted it.

## Names

Product name: Forma Zieleni. Roles: Owner, Agnieszka, engineering.
Project classes: `REAL_PROJECT`, `CONCEPT_PROJECT`, `ILLUSTRATIVE_PROJECT`.
A concept or illustrative project is not a client realization.

Write Owner gates as OWNER-DECISION, OWNER-ONLY, or DANGEROUS. Silence is
not approval.

## Synthetic data

Examples that are not live business records say `SYNTHETIC / TEST ONLY`.
Do not put a customer name, address, phone, or contract into a guide.

## Public git

If a procedure needs a secret or a private customer record, it does not
belong in this repository. Say that the step is private and stop.

## Dangerous operations

A page that mentions push, deploy, DNS, or Cloudflare says those actions
are not authorized by the page.
