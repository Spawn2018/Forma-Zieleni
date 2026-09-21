# Failure notification contract

Status: DESIGNED. No threshold in this page is a number. No pager is connected.

A future alert needs all of these before it can page a person:

- signal name
- who is harmed if it fires
- the baseline the threshold came from
- an owner role
- a diagnostic page
- the action a person can take
- how repeats are folded into one notice

An alert with no decision is not an alert. If the same safe response would always be correct, record that as an automation candidate in FZ-CIS instead of paging the Owner.

Health and readiness today are local HTTP checks. They are not production alerts. Session replay stays off. Customer tracking stays off.
