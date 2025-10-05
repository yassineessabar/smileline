import fetch from "node-fetch";
import * as cheerio from "cheerio";

/**
 * Convert ISO (YYYY-MM-DD) to DD/MM/YYYY
 */
function toDdmmyyyy(date) {
  if (!date) return "";
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : date;
}

export default async function handler(req, res) {
  const method = req.method || "GET";

  const input =
    method === "POST" && req.body && Object.keys(req.body).length
      ? req.body
      : req.query;

  const payload = {
    booking_link: input.booking_link,
    gender: input.gender,
    firstName: input.firstName,
    lastName: input.lastName,
    dateOfBirth: input.dateOfBirth,
    email: input.email,
    phone: input.phone,
    notes: input.notes,
  };

  if (!payload.booking_link) {
    return res
      .status(400)
      .json({ success: false, error: "Missing booking_link parameter." });
  }

  try {
    const response = await fetch(payload.booking_link);
    const html = await response.text();
    const $ = cheerio.load(html);

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
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ success: false, error: error.message || String(error) });
  }
}
