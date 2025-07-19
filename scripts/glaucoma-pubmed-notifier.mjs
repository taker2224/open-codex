#!/usr/bin/env node
// Fetch latest glaucoma papers from PubMed and notify every day at 08:00.
// Uses only built-in Node.js modules so it works without installing
// additional packages.  If Gmail credentials are provided via environment
// variables, an email will be sent in addition to console output.

const TERM = "glaucoma";
const RETMAX = 3;

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;
const GMAIL_TO = process.env.GMAIL_TO || GMAIL_USER;

import tls from "tls";
import { once } from "events";

async function sendEmail({ subject, body }) {
  if (!GMAIL_USER || !GMAIL_PASS || !GMAIL_TO) return;

  const socket = tls.connect(465, "smtp.gmail.com", { rejectUnauthorized: false });
  await once(socket, "secureConnect");

  const read = async () => (await once(socket, "data"))[0].toString();
  const write = (str) => socket.write(str + "\r\n");
  const expect = async (code) => {
    const res = await read();
    if (!res.startsWith(code)) {
      throw new Error(`SMTP expected ${code} got ${res.trim()}`);
    }
  };

  await expect("220");
  write("EHLO localhost");
  await expect("250");
  write("AUTH LOGIN");
  await expect("334");
  write(Buffer.from(GMAIL_USER).toString("base64"));
  await expect("334");
  write(Buffer.from(GMAIL_PASS).toString("base64"));
  await expect("235");
  write(`MAIL FROM:<${GMAIL_USER}>`);
  await expect("250");
  write(`RCPT TO:<${GMAIL_TO}>`);
  await expect("250");
  write("DATA");
  await expect("354");
  write(`Subject: ${subject}\r\nFrom: ${GMAIL_USER}\r\nTo: ${GMAIL_TO}\r\n\r\n${body}\r\n.\r\n`);
  await expect("250");
  write("QUIT");
  await expect("221");
  socket.end();
}

function pubmedSearchUrl(term) {
  const params = new URLSearchParams({
    db: "pubmed",
    sort: "pub date",
    retmode: "json",
    retmax: String(RETMAX),
    term,
  });
  return `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?${params}`;
}

async function fetchIds() {
  const res = await fetch(pubmedSearchUrl(TERM));
  if (!res.ok) {
    throw new Error(`search request failed: ${res.status}`);
  }
  const data = await res.json();
  return data.esearchresult.idlist || [];
}

async function fetchSummaries(ids) {
  if (!ids.length) return [];
  const params = new URLSearchParams({
    db: "pubmed",
    retmode: "json",
    id: ids.join(","),
  });
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?${params}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`summary request failed: ${res.status}`);
  }
  const data = await res.json();
  return ids.map((id) => data.result[id]).filter(Boolean);
}

async function notifyOnce() {
  try {
    const ids = await fetchIds();
    const summaries = await fetchSummaries(ids);
    let text = "\n\u{1F4D5} Latest glaucoma papers from PubMed:\n\n";
    summaries.forEach((s, i) => {
      text += `${i + 1}. ${s.title} (${s.pubdate})\n`;
      text += `   https://pubmed.ncbi.nlm.nih.gov/${s.uid}/\n\n`;
    });
    console.log(text);
    await sendEmail({ subject: "Daily PubMed glaucoma papers", body: text });
  } catch (err) {
    console.error("Failed to fetch PubMed data:", err.message);
  }
}

function msUntilNextEight() {
  const now = new Date();
  const next = new Date();
  next.setHours(8, 0, 0, 0);
  if (now >= next) next.setDate(next.getDate() + 1);
  return next - now;
}

function scheduleDaily() {
  setTimeout(function run() {
    notifyOnce();
    setTimeout(run, 24 * 60 * 60 * 1000);
  }, msUntilNextEight());
}

if (import.meta.url === `file://${process.argv[1]}`) {
  scheduleDaily();
}

export { notifyOnce, scheduleDaily };
