# ADMIN-PROJECT-DELIVER

Status: COMPLETE. Gate: REVIEW.

Staff mark a planned project delivered in `apps/admin` through Core API
`POST /v1/projects/{projectId}/deliver`. There is no second project store.

## Control

The button appears only when the project status is `planned`. The
request body is `{}`. A delivered project shows its status and no
second deliver control.

Core API still refuses a project that is not deliverable. Garden
linkage stays behind that rule.

## Authorization

Existing staff capability `projects:create`. The portal does not gain
a deliver control in this slice.
