import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";

/* ---------------------------------------------------------
   🔐 Supabase Configuration (hardcoded)
--------------------------------------------------------- */
const SUPABASE_URL = "https://vshyobkcfuisewtdpxpt.supabase.co";
const SUPABASE_SERVICE_ROLE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzaHlvYmtjZnVpc2V3dGRweHB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU1ODk0MSwiZXhwIjoyMDc1MTM0OTQxfQ.lbry232WVJVY2bgjj1_jlHLKaqctHEZ-OvwCKb126UA";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

/* ---------------------------------------------------------
   🧩 Utility — Normalize date labels
--------------------------------------------------------- */
function parseDateLabel(label: string): string | null {
  if (!label) return null;
  const now = new Date();
  const low = label.toLowerCase().trim();

  if (low.includes("today")) return now.toISOString().split("T")[0];
  if (low.includes("tomorrow")) {
    const t = new Date(now);
    t.setDate(now.getDate() + 1);
    return t.toISOString().split("T")[0];
  }

  const match = label.match(/([A-Za-z]{3,})\s+(\d{1,2})/);
  if (match) {
    const month = match[1];
    const day = parseInt(match[2]);
    const date = new Date(`${month} ${day}, ${now.getFullYear()}`);
    if (!isNaN(date.getTime())) return date.toISOString().split("T")[0];
  }
  return null;
}

/* ---------------------------------------------------------
   🔁 Supabase Sync Logic
--------------------------------------------------------- */
async function syncSlotsToSupabase(practiceId: number, slots: any[]) {
  const { data: existing, error: existingError } = await supabase
    .from("dental_appointment_slots")
    .select("agg_id, available")
    .eq("practice_id", practiceId);

  if (existingError) {
    console.error("❌ Failed to fetch existing slots:", existingError);
    return { status: "error", message: existingError.message };
  }

  const existingIds = new Set(existing.map((r: any) => r.agg_id));
  const currentIds = new Set(slots.map((s: any) => s.agg_id));

  const newSlots = slots.filter((s) => !existingIds.has(s.agg_id));
  const toDelete = [...existingIds].filter((id) => !currentIds.has(id));

  console.log(
    `🩺 Practice ${practiceId}: ${slots.length} slots → ${newSlots.length} new, ${toDelete.length} deleted`
  );

  if (newSlots.length > 0) {
    const { error } = await supabase.from("dental_appointment_slots").insert(newSlots);
    if (error) console.error("❌ Insert error:", error);
  }

  if (toDelete.length > 0) {
    const { error } = await supabase
      .from("dental_appointment_slots")
      .delete()
      .in("agg_id", toDelete);
    if (error) console.error("❌ Delete error:", error);
  }

  return {
    status: "success",
    new_count: newSlots.length,
    deleted_count: toDelete.length,
    total: slots.length,
    timestamp: new Date().toISOString(),
  };
}

/* ---------------------------------------------------------
   🚀 Main Handler
--------------------------------------------------------- */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const orgNumber = parseInt((req.query.org_id as string) || "394", 10);

    // 1️⃣ Get practice info from Supabase
    const { data: practice, error: practiceError } = await supabase
      .from("practice")
      .select("*")
      .eq("org_number", orgNumber)
      .single();

    if (practiceError || !practice) {
      console.error("❌ Practice not found:", practiceError);
      return res
        .status(404)
        .json({ success: false, error: "Practice not found in Supabase" });
    }

    const practiceId = practice.id;
    const url = practice.booking_url;
    console.log(`🏥 Scanning ${practice.name} (${url})`);

    // 2️⃣ Fetch booking page HTML
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url} (${response.status})`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // 3️⃣ Parse doctors (if visible)
    const doctors: string[] = [];
    $(".ui-select-choices-row").each((_, el) => {
      const text = $(el).text().trim();
      if (text && !text.toLowerCase().includes("available")) doctors.push(text);
    });

    // 4️⃣ Parse available slots
    const slots: any[] = [];
    $(".search-location__day").each((_, dayEl) => {
      const dateLabel = $(dayEl)
        .find(".search-location__dayInfo .ng-binding")
        .text()
        .trim();
      const dateParsed = parseDateLabel(dateLabel);

      $(dayEl)
        .find(".time.time__label")
        .each((_, slotEl) => {
          const disabled = $(slotEl).hasClass("time__label_disabled");
          const time = $(slotEl).text().trim();
          const checkbox = $(slotEl).find("input[name='time']");
          const timeId = checkbox.attr("value") || "";
          const aggId = checkbox.attr("aggid") || timeId;

          if (time && dateParsed && !disabled) {
            slots.push({
              doctor: doctors[0] || "Unknown",
              date: dateParsed,
              time,
              available: true,
              time_id: timeId,
              agg_id: aggId,
              booking_link: `${url}`,
              practice_id: practiceId,
              last_checked: new Date().toISOString(),
              first_seen: new Date().toISOString(),
              last_available_change: new Date().toISOString(),
            });
          }
        });
    });

    console.log(`🕒 Found ${slots.length} available slots`);

    // 5️⃣ Sync data with Supabase
    const syncResult = await syncSlotsToSupabase(practiceId, slots);

    // 6️⃣ Respond
    return res.status(200).json({
      success: true,
      practice: practice.name,
      org_number: orgNumber,
      doctors_found: doctors.length,
      total_slots_scanned: slots.length,
      sync_result: syncResult,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("❌ Error in /api/dental4web-sync:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
      stack: err.stack,
    });
  }
}
