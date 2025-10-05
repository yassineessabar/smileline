import type { VercelRequest, VercelResponse } from "@vercel/node";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

// helper: format date YYYY-MM-DD → DD/MM/YYYY
function toDdmmyyyy(date?: string): string {
  if (!date) return "";
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : date;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const method = req.method || "GET";
    const input =
      method === "POST" && req.body && Object.keys(req.body).length
        ? req.body
        : req.query;

    const booking_link = input.booking_link as string;
    if (!booking_link) {
      return res
        .status(400)
        .json({ success: false, error: "Missing booking_link parameter." });
    }

    // Fetch the page and prefill some fields for preview
    const response = await fetch(booking_link);
    const html = await response.text();
    const $ = cheerio.load(html);

    if (input.firstName) $("#firstName").attr("value", input.firstName);
    if (input.lastName) $("#lastName").attr("value", input.lastName);
    if (input.dateOfBirth)
      $("#datepicker").attr("value", toDdmmyyyy(input.dateOfBirth));
    if (input.phone) $("#msisdn").attr("value", input.phone);
    if (input.email) $("#eMail").attr("value", input.email);
    if (input.notes) $("textarea#notes").text(input.notes);

    const renderedBody = $("body").html()?.replace(/"/g, "&quot;") || "";

    const outputHtml = `
      <html>
        <head><title>✅ Centaur Autofill (No Defaults)</title></head>
        <body style="font-family:sans-serif;">
          <h2>✅ Centaur Autofill (No Defaults)</h2>
          <p><strong>Booking Link:</strong> ${booking_link}</p>
          <iframe srcdoc="${renderedBody}" 
                  style="width:100%;height:800px;border:1px solid #ccc;"></iframe>
          <p style="color:#c00"><em>Serverless autofill complete — no defaults used.</em></p>
        </body>
      </html>
    `;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(outputHtml);
  } catch (err: any) {
    console.error("❌ Error:", err);
    return res
      .status(500)
      .json({ success: false, error: err.message || String(err) });
  }
}
