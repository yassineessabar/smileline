// api/book.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const method = (req.method || "GET").toUpperCase();
    const input = method === "POST" && req.body && Object.keys(req.body).length ? req.body : req.query;

    // echo back exactly what we received (no defaults)
    const payload = {
      booking_link: input.booking_link,
      gender: input.gender,
      firstName: input.firstName,
      lastName: input.lastName,
      dateOfBirth: input.dateOfBirth,
      email: input.email,
      phone: input.phone,
      notes: input.notes,
      method
    };

    // Add a tiny log (visible in Vercel logs)
    console.log("DEBUG /api/book payload:", JSON.stringify(payload));

    // Basic validation: booking_link must be present
    if (!payload.booking_link) {
      return res.status(400).json({ success: false, error: "Missing booking_link parameter", payload });
    }

    // Respond with a small, deterministic JSON
    return res.status(200).json({ success: true, message: "Diagnostic echo OK", payload });
  } catch (err: any) {
    console.error("❌ /api/book crashed:", err);
    return res.status(500).json({ success: false, error: String(err) });
  }
}
