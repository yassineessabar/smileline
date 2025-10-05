import type { VercelRequest, VercelResponse } from "@vercel/node";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

function toDdmmyyyy(date: string | undefined) {
  if (!date) return "";
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : date;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
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
      notes: input.notes as string,
      mode: input.mode || "test",
    };

    if (!payload.booking_link) {
      return res.status(400).json({
        success: false,
        error: "Missing booking_link parameter.",
      });
    }

    // Fetch the page (simulate loading)
    const response = await fetch(payload.booking_link);
    if (!response.ok) {
      return res.status(500).json({
        success: false,
        error: `Failed to fetch booking page (status ${response.status})`,
      });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Prefill only if fields exist
    if (payload.firstName) $("#firstName").attr("value", payload.firstName);
    if (payload.lastName) $("#lastName").attr("value", payload.lastName);
    if (payload.dateOfBirth)
      $("#datepicker").attr("value", toDdmmyyyy(payload.dateOfBirth));
    if (payload.phone) $("#msisdn").attr("value", payload.phone);
    if (payload.email) $("#eMail").attr("value", payload.email);
    if (payload.notes) $("textarea#notes").text(payload.notes);

    // Simulate different modes
    if (payload.mode === "test") {
      return res.status(200).json({
        success: true,
        mode: "test",
        description: "Prefill simulation successful (no form submitted).",
        data: payload,
      });
    }

    // (LIVE mode — only preview; real submission disabled)
    return res.status(200).json({
      success: true,
      mode: "live",
      description: "Prefill applied (submission disabled for safety).",
      data: payload,
    });
  } catch (error: any) {
    console.error("❌ API Error:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || String(error),
    });
  }
}
