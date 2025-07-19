# PubMed Glaucoma Notifier

This script fetches the latest glaucoma related papers from PubMed and notifies
you every day at **08:00**.

It relies only on built-in Node.js APIs, so no extra packages are required.  If
you provide Gmail credentials via environment variables, the notifier will also
send an email with the results.

## Usage

```bash
# Run the notifier
node scripts/glaucoma-pubmed-notifier.mjs
```

To enable email delivery via Gmail, export the following variables before
running the script:

```bash
export GMAIL_USER="your.address@gmail.com"
export GMAIL_PASS="your-app-password"
export GMAIL_TO="recipient@gmail.com" # optional, defaults to GMAIL_USER
```

When executed, the script waits until the next 08:00 (server local time),
fetches the most recent PubMed entries related to "glaucoma" and prints the
title, publication date and a direct link for each. If Gmail credentials are
available, the same information is emailed to you as well.
