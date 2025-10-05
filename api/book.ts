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

  const payload = {
    booking_link: input.booking_link as string,
    gender: input.gender as string,
    firstName: input.firstName as string,
    lastName: input.lastName as string,
    dateOfBirth: input.dateOfBirth as string,
    email: input.email as string,
    phone: input.phone as string,
    notes: decodeURIComponent((input.notes as string) || ""),
    mode: (input.mode as string)?.toLowerCase() || "test", // test or live
  };

  if (!payload.booking_link) {
    return res.status(400).json({
      success: false,
      mode: payload.mode,
      description: "Missing booking_link parameter.",
    });
  }

  try {
    const response = await fetch(payload.booking_link);
    if (!response.ok) {
      return res.status(500).json({
        success: false,
        mode: payload.mode,
        description: `Failed to load booking page (status ${response.status}).`,
      });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Prefill values only if form exists
    if ($("#firstName").length) $("#firstName").attr("value", payload.firstName);
    if ($("#lastName").length) $("#lastName").attr("value", payload.lastName);
    if ($("#datepicker").length)
      $("#datepicker").attr("value", toDdmmyyyy(payload.dateOfBirth));
    if ($("#msisdn").length) $("#msisdn").attr("value", payload.phone);
    if ($("#eMail").length) $("#eMail").attr("value", payload.email);
    if ($("#notes").length) $("textarea#notes").text(payload.notes);

    // Test mode → just verify prefill success
    if (payload.mode === "test") {
      return res.status(200).json({
        success: true,
        mode: "test",
        description: "Prefill completed successfully (no form submission).",
        data: {
          booking_link: payload.booking_link,
          firstName: payload.firstName,
          lastName: payload.lastName,
          dateOfBirth: payload.dateOfBirth,
          email: payload.email,
          phone: payload.phone,
          notes: payload.notes,
        },
      });
    }

    // Live submission placeholder (to be automated later)
    // For now just acknowledge
    return res.status(200).json({
      success: true,
      mode: "live",
      description:
        "Live submission placeholder — will be implemented with headless browser automation.",
    });
  } catch (error: any) {
    console.error("❌ Error:", error);
    return res.status(500).json({
      success: false,
      mode: payload.mode,
      description: error.message || String(error),
    });
  }
}
