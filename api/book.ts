import type { VercelRequest, VercelResponse } from "@vercel/node";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

function toDdmmyyyy(date?: string) {
  if (!date) return "";
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : date;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const input = req.method === "POST" ? req.body : req.query;
    const {
      booking_link,
      gender,
      firstName,
      lastName,
      dateOfBirth,
      email,
      phone,
      notes,
    } = input as any;

    if (!booking_link) {
      return res.status(400).json({ success: false, error: "Missing booking_link" });
    }

    console.log("Fetching booking page:", booking_link);
    const response = await fetch(booking_link);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Prefill fields if found
    if ($("#firstName").length) $("#firstName").attr("value", firstName || "");
    if ($("#lastName").length) $("#lastName").attr("value", lastName || "");
    if ($("#datepicker").length)
      $("#datepicker").attr("value", toDdmmyyyy(dateOfBirth));
    if ($("#msisdn").length) $("#msisdn").attr("value", phone || "");
    if ($("#eMail").length) $("#eMail").attr("value", email || "");
    if ($("#notes").length) $("#notes").text(notes || "");

    const htmlBody = $("body").html() || "";

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(`
      <html>
        <head><title>Centaur Autofill Result</title></head>
        <body style="font-family:sans-serif">
          <h2>✅ Centaur Autofill Completed</h2>
          <p><strong>Booking Link:</strong> ${booking_link}</p>
          <iframe srcdoc="${htmlBody.replace(/"/g, "&quot;")}" 
                  style="width:100%;height:800px;border:1px solid #ccc"></iframe>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error("❌ Server error:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Internal server error",
    });
  }
}
