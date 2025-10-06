import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as cheerio from "cheerio";

/**
 * Convert human-readable date labels ("Today", "Oct 7, Tue") into ISO date.
 */
function parseDateLabel(dateText: string): string | null {
  if (!dateText) return null;
  const text = dateText.trim().toLowerCase();
  const now = new Date();

  if (text.includes("today")) return now.toISOString().split("T")[0];
  if (text.includes("tomorrow")) {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  }

  const match = text.match(/([A-Za-z]{3,})\s+(\d{1,2})/);
  if (match) {
    const month = match[1];
    const day = parseInt(match[2]);
    const parsed = new Date(`${month} ${day}, ${now.getFullYear()}`);
    if (!isNaN(parsed.getTime())) return parsed.toISOString().split("T")[0];
  }
  return null;
}

/**
 * Main API handler — scans a Dental4Web org page and extracts practice info.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Default to Lily’s Dental (org 394) if not provided
    const orgId = (req.query.org_id as string) || "394";
    const url = `https://www.centaurportal.com/d4w/org-${orgId}/extended_search?sourceID=null`;

    console.log(`🦷 Scanning Dental4Web org ${orgId}`);

    // Fetch the booking page with a browser-like User-Agent
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return res.status(500).json({
        success: false,
        error: `Failed to fetch booking page (status ${response.status})`,
      });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // 1️⃣ Practice Name
    const practiceName =
      $("p[ng-bind='ctrl.practice.name']").text().trim() || "Unknown Practice";

    // 2️⃣ Doctor List
    const doctors: string[] = [];
    $(".ui-select-choices-row").each((_, el) => {
      const text = $(el).text().trim();
      if (text && !text.toLowerCase().includes("available")) doctors.push(text);
    });

    // 3️⃣ Slot Data (if any static HTML exists)
    const slots: { date: string; time: string }[] = [];
    $(".search-location__day").each((_, dayEl) => {
      const dateLabel = $(dayEl)
        .find(".search-location__dayInfo .ng-binding")
        .text()
        .trim();
      const parsedDate = parseDateLabel(dateLabel);
      $(dayEl)
        .find(".time__label:not(.time__label_disabled)")
        .each((_, slotEl) => {
          const time = $(slotEl).text().trim();
          if (parsedDate && time) slots.push({ date: parsedDate, time });
        });
    });

    // 4️⃣ Build JSON Response
    const result = {
      practice_name: practiceName,
      link: url,
      doctors,
      total_slots_found: slots.length,
      sample_slots: slots.slice(0, 10),
    };

    return res.status(200).json({
      success: true,
      data: result,
      description: `Scanned org ${orgId}`,
    });
  } catch (error: any) {
    console.error("❌ API Error:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || String(error),
    });
  }
}
