# Admin file name revision

Status: contracted for `ADMIN-FILE-NAME-REVISE` / `FZ-REQ-ADMIN-021`.

## Surface

Staff can correct the display name of a project file.
`POST /v1/files/{fileId}/name` accepts `name` only. Bytes, mime type,
size, and client subject stay unchanged. The same name is stored once.

`apps/admin` shows the current name in **Nowa nazwa** and posts
**Popraw nazwę**. A blank name does not leave the panel.

The portal reads the new name and still omits `updatedAt`, storage
keys, and bytes.

## Out of scope

- Replacing file bytes on this route.
- Changing mime type, size, or client subject.
- Payment, signing, and storage fields.
- DNS, Cloudflare, deploy, and live customer data.
