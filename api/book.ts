import type { VercelRequest, VercelResponse } from "@vercel/node";
import fetch from "node-fetch";

function toDdmmyyyy(date?: string) {
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

    // Test reachability of Centaur page (lightweight HEAD request)
    const testResp = await fetch(payload.booking_link, { method: "HEAD" });
    if (!testResp.ok) {
      return res.status(400).json({
        success: false,
        error: `Centaur page not reachable (status ${testResp.status})`,
      });
    }

    // Return structured confirmation
    return res.status(200).json({
      success: true,
      message: "Booking autofill parameters received successfully.",
      payload: {
        ...payload,
        dateOfBirthFormatted: toDdmmyyyy(payload.dateOfBirth),
      },
    });
  } catch (err: any) {
    console.error("❌ Serverless crash caught:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
}
