// api/book.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as cheerio from "cheerio";

// YYYY-MM-DD -> DD/MM/YYYY (Centaur DOB mask)
function toDdmmyyyy(date?: string) {
  if (!date) return "";
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : date;
}

// Robust "get param" helper that handles string | string[]
function pick(q: unknown): string {
  if (Array.isArray(q)) return q[0] ?? "";
  return typeof q === "string" ? q : "";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const isPost = (req.method || "GET").toUpperCase() === "POST";
    const source = isPost && req.body && typeof req.body === "object" ? req.body : req.query;

    // No defaults — only what you pass
    const booking_link = pick(source.booking_link);
    const gender       = pick(source.gender);       // "Ms." / "Mr." etc. (informational only here)
    const firstName    = pick(source.firstName);
    const lastName     = pick(source.lastName);
    const dateOfBirth  = pick(source.dateOfBirth);
    const email        = pick(source.email);
    const phone        = pick(source.phone);
    const notes        = pick(source.notes);
    const format       = (pick(source.format) || "").toLowerCase(); // "json" to force JSON

    if (!booking_link) {
      return res.status(400).json({ success: false, error: "Missing booking_link" });
    }

    // Fetch Centaur page (use Node 20's global fetch)
    const pageResp = await fetch(booking_link, {
      headers: {
        // A friendlier UA helps some WAFs/CDNs
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });

    if (!pageResp.ok) {
      const t = await pageResp.text().catch(() => "");
      // Always return JSON on upstream fetch failure regardless of format
      return res.status(502).json({
        success: false,
        error: `Upstream returned ${pageResp.status}`,
        details: t.slice(0, 4000)
      });
    }

    const html = await pageResp.text();
    const $ = cheerio.load(html);

    // Prefill what we can (only if fields exist)
    if (firstName) $("#firstName").attr("value", firstName);
    if (lastName) $("#lastName").attr("value", lastName);
    if (dateOfBirth) $("#datepicker").attr("value", toDdmmyyyy(dateOfBirth));
    if (phone) $("#msisdn").attr("value", phone);
    if (email) $("#eMail").attr("value", email);
    if (notes) $("textarea#notes").text(notes);

    // NOTE: gender is a UI-select; without JS runtime we can’t safely toggle it server-side.
    // We still include it in the summary below so you can verify the parameter passed through.

    // Build response
    const modifiedFullHtml = $.root().html() || "<html><body>Empty</body></html>";
    const base64Doc = Buffer.from(modifiedFullHtml, "utf-8").toString("base64");
    const dataUrl = `data:text/html;base64,${base64Doc}`;

    // JSON format explicitly requested
    if (format === "json" || (req.headers.accept || "").includes("application/json")) {
      return res.status(200).json({
        success: true,
        mode: "preview",
        message: "Autofill prepared (no submission).",
        echo: { booking_link, gender, firstName, lastName, dateOfBirth, email, phone, notes },
        preview: dataUrl
      });
    }

    // HTML preview by default (easiest to eyeball in browser)
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Centaur Autofill (Preview)</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin: 24px; }
    code, pre { background: #f6f8fa; padding: 2px 6px; border-radius: 4px; }
    .box { border: 1px solid #ddd; border-radius: 8px; padding: 12px; }
  </style>
</head>
<body>
  <h2>✅ Centaur Autofill (Preview — No Submit)</h2>
  <div class="box">
    <p><b>Booking Link:</b> <a target="_blank" rel="noopener" href="${booking_link}">${booking_link}</a></p>
    <ul>
      <li>Gender: ${gender || "(not provided)"}</li>
      <li>First Name: ${firstName || "(not provided)"}</li>
      <li>Last Name: ${lastName || "(not provided)"}</li>
      <li>DOB: ${dateOfBirth || "(not provided)"} → ${toDdmmyyyy(dateOfBirth) || "(n/a)"}</li>
      <li>Email: ${email || "(not provided)"}</li>
      <li>Phone: ${phone || "(not provided)"}</li>
      <li>Notes: ${notes || "(not provided)"}</li>
    </ul>
  </div>
  <p style="margin-top:16px;color:#c00"><em>This is a server-side prefill preview. No button is clicked.</em></p>
  <h3 style="margin-top:24px;">Page Preview (Embedded)</h3>
  <iframe src="${dataUrl}" style="width:100%;height:900px;border:1px solid #ccc;border-radius:8px;"></iframe>
</body>
</html>`);
  } catch (err: any) {
    // Hard error — always JSON so you get a clear message in curl and logs.
    return res.status(500).json({
      success: false,
      error: err?.message || String(err)
    });
  }
}
