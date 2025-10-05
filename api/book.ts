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

  // Accept query params or JSON body
  const input =
    method === "POST" && req.body && Object.keys(req.body).length
      ? req.body
      : req.query;

  // ❌ No defaults — only what is passed by the client
  const payload = {
    booking_link: input.booking_link as string,
    gender: input.gender as string,
    firstName: input.firstName as string,
    lastName: input.lastName as string,
    dateOfBirth: input.dateOfBirth as string,
    email: input.email as string,
    phone: input.phone as string,
    notes: input.notes as string,
  };

  if (!payload.booking_link) {
    return res.status(400).json({
      success: false,
      error: "Missing booking_link parameter.",
    });
  }

  try {
    // Fetch the original booking page
    const response = await fetch(payload.booking_link);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Prefill only provided fields
    if (payload.firstName) $("#firstName").attr("value", payload.firstName);
    if (payload.lastName) $("#lastName").attr("value", payload.lastName);
    if (payload.dateOfBirth)
      $("#datepicker").attr("value", toDdmmyyyy(payload.dateOfBirth));
    if (payload.phone) $("#msisdn").attr("value", payload.phone);
    if (payload.email) $("#eMail").attr("value", payload.email);
    if (payload.notes) $("textarea#notes").text(payload.notes);

    const renderedBody = $("body").html()?.replace(/"/g, "&quot;") || "";

    const outputHtml = `
      <html>
        <head><title>✅ Centaur Autofill (No Defaults)</title></head>
        <body style="font-family:sans-serif;">
          <h2>✅ Centaur Autofill (No Defaults)</h2>
          <p><strong>Booking Link:</strong> ${payload.booking_link}</p>
          <iframe srcdoc="${renderedBody}" style="width:100%;height:800px;border:1px solid #ccc;"></iframe>
          <p style="color:#c00"><em>Serverless autofill complete — no defaults used.</em></p>
        </body>
      </html>
    `;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(outputHtml);
  } catch (error: any) {
    console.error("❌ Error:", error);
    res.status(500).json({ success: false, error: error.message || String(error) });
  }
}
