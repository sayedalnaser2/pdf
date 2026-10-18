# PrivatePDF

A free, fully client-side alternative to iLovePDF. Open `index.html` through any static server
(`python3 -m http.server`) — there is no backend and files never leave the browser.

## Fixes for common iLovePDF complaints (from G2, Capterra, SaaSworthy, Trustpilot)
| Complaint | Here |
|---|---|
| Files uploaded to a server (privacy) | Everything runs locally in the browser |
| Free-tier file-size / daily limits | None |
| OCR & advanced features paywalled | OCR, redaction, metadata cleaning free |
| Intrusive ads | None |
| No direct text editing | "Edit text" – click existing text to change it |
| Slow upload/download | No network round-trip; works offline |
| Surprise subscription charges | No accounts or payments |

Tools (18): Edit, Merge, Split, Organize, Rotate, Remove pages, Crop, Compress (lossless or image-based), Images→PDF, PDF→Images,
Watermark, Page numbers, Header & footer, Fill forms, Extract text, Redact (true, with regex finder), OCR, Metadata cleaner.

Libraries (vendored in `vendor/`): pdf-lib, pdf.js, JSZip. OCR loads tesseract.js from a CDN on first use.
Limits: no PDF encryption/password-adding; text edits use standard fonts (Latin characters).

## Install as an app
Served over HTTPS (e.g. GitHub Pages), PrivatePDF is an installable PWA: click **Install app** in the header
(or the install icon in Chrome/Edge, or Share → Add to Home Screen on iPhone). It then opens in its own window,
works fully offline (all code is precached), and can be chosen in "Open with…" for `.pdf` files (Chrome/Edge desktop).
