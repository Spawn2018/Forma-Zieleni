# File byte labels

Status: contracted for `FILE-BYTE-LABELS` / `FZ-REQ-PORTAL-023` and `FZ-REQ-ADMIN-033`.

## Surface

Staff and the client read a file size as an exact byte count. A space
separates each group of three digits. `2048` is shown as `2 048 B`. The
count is not rounded into kilobytes or megabytes.

A size that is not a non-negative integer is shown as `rozmiar nieczytelny`.
The raw number is not printed. The file row stays on the list.

The staff upload hint uses the same words. Creating a file still posts the
raw integer `sizeBytes`.

## Out of scope

- A new file field or a stored display size.
- Changing the stored byte count.
- Payment, signing, and a storage provider.
- DNS, Cloudflare, deploy, and live customer data.
