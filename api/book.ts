import type { VercelRequest, VercelResponse } from "@vercel/node";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

function toDdmmyyyy(date: string | undefined) {
  if (!date) return "";
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : date;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method || "GET";
  const input =
    method === "POST" && req.body && Object.keys(req.body).length
      ? req.body
      : req.query;

  const {
    booking_link,
    gender,
    firstName,
    lastName,
    dateOfBirth,
    email,
    phone,
    notes,
  } = input as Record<string, string>;

  if (!booking_link) {
    return res.status(400).json({ success: false, error: "Missing booking_link" });
  }

  try {
    const response = await fetch(booking_link);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Prefill fields only if provided
    if (firstName) $("#firstName").attr("value", firstName);
    if (lastName) $("#lastName").attr("value", lastName);
    if (dateOfBirth) $("#datepicker").attr("value", toDdmmyyyy(dateOfBirth));
    if (phone) $("#msisdn").attr("value", phone);
    if (email) $("#eMail").attr("value", email);
    if (notes) $("textarea#notes").text(notes);

    // Simple visual feedback at the top of the page
    $("body").prepend(`
      <div style="background:#e0ffe0;border:1px solid #0a0;padding:10px;margin-bottom:10px">
        ✅ Autofill simulated on server (no defaults, no submission)<br/>
        <strong>${firstName || ""} ${lastName || ""}</strong>
      </div>
    `);

    const rendered = $.html();

    if (method === "GET") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(`
        <html>
          <head><title>Centaur Autofill (Server Rendered)</title></head>
          <body style="font-family:sans-serif;">
            <h2>✅ Centaur Autofill (Server Rendered)</h2>
            <p><strong>Booking link:</strong> ${booking_link}</p>
            <iframe srcdoc="${rendered.replace(/"/g, "&quot;")}" style="width:100%;height:900px;border:1px solid #ccc;"></iframe>
            <p style="color:#c00"><em>Form filled (no submission).</em></p>
          </body>
        </html>
      `);
    } else {
      return res.status(200).json({
        success: true,
        message: "Autofill simulated successfully (no submission)",
        previewLength: rendered.length,
      });
    }
  } catch (err: any) {
    console.error("❌ Error:", err);
    return res.status(500).json({ success: false, error: err.message || String(err) });
  }
}
