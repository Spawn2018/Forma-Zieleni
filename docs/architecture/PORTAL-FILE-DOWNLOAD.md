# Portal file download

Status: contracted for `PORTAL-FILE-DOWNLOAD` / `FZ-REQ-PORTAL-013`.

## Surface

An authenticated client can download the bytes of their own project file.
`GET /v1/portal/files/{fileId}/content` uses `files:portal-read` and the
existing portal file projection. A file without that client subject is
not found, including a staff-only file. The staff route
`GET /v1/files/{fileId}/content` stays forbidden to the portal.

The response is the stored bytes, with the file mime type, an attachment
name, a private cache header, and the sha256 checksum. No storage key
and no public URL.

`apps/portal` shows **Pobierz «name»** and proxies the download through
`/files/{fileId}/content`. The proxy forwards the session cookie.

## Out of scope

- Uploading bytes from the portal.
- Changing the file name, mime type, or client subject.
- Payment, signing, and a public file URL.
- DNS, Cloudflare, deploy, and live customer data.
