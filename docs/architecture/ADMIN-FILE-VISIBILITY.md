# Admin file visibility

Status: contracted for `ADMIN-FILE-VISIBILITY` / `FZ-REQ-ADMIN-022`.

## Surface

Staff posts `{ "visible": true }` or `{ "visible": false }` to
`POST /v1/files/{fileId}/visibility`.

Showing a file copies `clientSubject` from the owning project. Hiding a
file clears it. The request cannot name a subject, a name, bytes, or a
storage key. Name, mime type, and size stay unchanged. The same
visibility is returned unchanged.

A project with no client cannot be shown a file. The portal then omits
a hidden file and answers 404 for its metadata and bytes. Another
client still cannot read a shown file.

The admin list says **widoczny dla klienta** or **tylko personel** and
offers **Ukryj przed klientem** or **Pokaż klientowi**. The subject
string is not rendered.

## Out of scope

- A public file URL.
- Payment, signing, and a new byte store.
- DNS, Cloudflare, deploy, and live customer data.
