# Portal project files

Status: contracted for `PORTAL-PROJECT-FILES` / `FZ-REQ-PORTAL-014`.

## Surface

Each portal project card lists the files already loaded for that project.
Each row keeps the existing download link. A file of another project stays
off the card. List order is unchanged.

When the file list is empty or the project has no file, the card says
**Pliki: brak**. When the file read fails or is forbidden, the card says
so and does not pretend the list is empty.

The separate file section still shows every loaded file.

## Out of scope

- A new file store or route.
- Uploading bytes from the portal.
- Payment, signing, and a public file URL.
- DNS, Cloudflare, deploy, and live customer data.
