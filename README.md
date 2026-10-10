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

## Bahrain Passport Reader (`passport.html`)
Batch-reads the MRZ (the two `P<BHR…` lines) from many passport scans (JPG/PNG/PDF), verifies all ICAO check digits,
and shows one editable sheet (name, passport no., nationality, DOB, sex, expiry, CPR/personal no.) with Excel / CSV / clipboard export.
Rows that fail a check digit are flagged ⚠; edit the MRZ text and the fields re-calculate. Runs locally (OCR via tesseract.js from a CDN on first use).
Parser: `mrz.js`.
