import type { VercelRequest, VercelResponse } from "@vercel/node";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

/** Convert YYYY-MM-DD → DD/MM/YYYY */
function toDdmmyyyy(date?: string) {
  if (!date) return "";
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : date;
}

/** ✅ ES Module-compatible default export */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
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
    } = input;

    if (!booking_link) {
      return res.status(400).json({
        success: false,
        error: "Missing booking_link parameter.",
      });
    }

    // Fetch page HTML
    const response = await fetch(booking_link as string);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Inject user data into form fields
    if (firstName) $("#firstName").attr("value", String(firstName));
    if (lastName) $("#lastName").attr("value", String(lastName));
    if (dateOfBirth) $("#datepicker").attr("value", toDdmmyyyy(String(dateOfBirth)));
    if (phone) $("#msisdn").attr("value", String(phone));
    if (email) $("#eMail").attr("value", String(email));
    if (notes) $("textarea#notes").text(String(notes));

    const renderedBody = $("body").html()?.replace(/"/g, "&quot;") || "";

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(`
      <html>
        <head><title>✅ Centaur Autofill</title></head>
        <body style="font-family:sans-serif;">
          <h2>✅ Centaur Autofill Success</h2>
          <p><strong>Booking Link:</strong> ${booking_link}</p>
          <iframe srcdoc="${renderedBody}" style="width:100%;height:800px;border:1px solid #ccc;"></iframe>
          <p style="color:#090"><em>Rendered dynamically via API (no Puppeteer)</em></p>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error("❌ Serverless error:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || String(error),
    });
  }
}
