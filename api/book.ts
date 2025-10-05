import type { VercelRequest, VercelResponse } from "@vercel/node";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

/**
 * Convert YYYY-MM-DD → DD/MM/YYYY for Centaur form
 */
function toDdmmyyyy(date: string | undefined): string {
  if (!date) return "";
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : date;
}

/**
 * Vercel API Route: /api/book
 * Example:
 * https://smileline.vercel.app/api/book?booking_link=...&firstName=Yassine...
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const method = req.method || "GET";
    const input =
      method === "POST" && req.body && Object.keys(req.body).length
        ? req.body
        : req.query;

    // Require booking_link
    if (!input.booking_link) {
      return res.status(400).json({
        success: false,
        error: "Missing booking_link parameter.",
      });
    }

    // Cast all fields as strings safely
    const payload = {
      booking_link: String(input.booking_link),
      gender: input.gender ? String(input.gender) : "",
      firstName: input.firstName ? String(input.firstName) : "",
      lastName: input.lastName ? String(input.lastName) : "",
      dateOfBirth: input.dateOfBirth ? String(input.dateOfBirth) : "",
      email: input.email ? String(input.email) : "",
      phone: input.phone ? String(input.phone) : "",
      notes: input.notes ? String(input.notes) : "",
    };

    console.log("📥 Received:", payload);

    // Fetch the booking form HTML
    const response = await fetch(payload.booking_link);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Autofill provided fields only
    if (payload.firstName) $("#firstName").attr("value", payload.firstName);
    if (payload.lastName) $("#lastName").attr("value", payload.lastName);
    if (payload.dateOfBirth)
      $("#datepicker").attr("value", toDdmmyyyy(payload.dateOfBirth));
    if (payload.phone) $("#msisdn").attr("value", payload.phone);
    if (payload.email) $("#eMail").attr("value", payload.email);
    if (payload.notes) $("textarea#notes").text(payload.notes);

    const bodyHtml = $("body").html()?.replace(/"/g, "&quot;") || "";

    const rendered = `
      <html>
        <head><title>Centaur Autofill</title></head>
        <body style="font-family: sans-serif;">
          <h2>✅ Form Autofill Successful</h2>
          <p><strong>Booking Link:</strong> ${payload.booking_link}</p>
          <iframe srcdoc="${bodyHtml}" style="width:100%;height:800px;border:1px solid #ccc;"></iframe>
        </body>
      </html>
    `;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(rendered);
  } catch (error: any) {
    console.error("❌ Error:", error);
    return res
      .status(500)
      .json({ success: false, error: error.message || String(error) });
  }
}
