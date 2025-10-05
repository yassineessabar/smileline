import type { VercelRequest, VercelResponse } from "@vercel/node";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

// Convert YYYY-MM-DD to DD/MM/YYYY
function toDdmmyyyy(date: string) {
  if (!date) return "";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) return date;
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return date;
  const [, y, mo, d] = m;
  return `${d}/${mo}/${y}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method || "GET";
  const demoPayload = {
    booking_link:
      "https://www.centaurportal.com/d4w/org-394/signup?time_id=1295778291_-1&shortVer=false&sourceID=null",
    gender: "Ms.",
    firstName: "Yassine",
    lastName: "Essabar",
    dateOfBirth: "1992-08-18",
    email: "essabar.yassine@gmail.com",
    phone: "0478505348",
    notes: "Test booking via automation (no submit)",
  };

  const payload =
    method === "POST" && req.body && Object.keys(req.body).length
      ? req.body
      : demoPayload;

  const { booking_link, firstName, lastName, dateOfBirth, email, phone } =
    payload;

  if (!booking_link) {
    return res.status(400).json({ success: false, error: "Missing booking_link" });
  }

  let browser: any;
  let page: any;

  try {
    const executablePath = await chromium.executablePath(
      "/tmp/chromium" // ✅ fallback extraction directory
    );

    browser = await puppeteer.launch({
      args: [...chromium.args, "--no-sandbox", "--disable-dev-shm-usage"],
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    });

    page = await browser.newPage();
    await page.goto(booking_link, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector(".signup__container", { timeout: 20000 });

    // Autofill demo
    await page.type("#firstName", firstName || "", { delay: 20 });
    await page.type("#lastName", lastName || "", { delay: 20 });
    await page.type("#datepicker", toDdmmyyyy(dateOfBirth), { delay: 20 });
    await page.type("#msisdn", phone || "", { delay: 20 });
    const emailHandle = await page.$("#eMail");
    if (emailHandle) await emailHandle.type(email || "", { delay: 20 });

    await page.waitForTimeout(1000);
    const png = await page.screenshot({ fullPage: true });
    const dataUrl = `data:image/png;base64,${png.toString("base64")}`;

    if (method === "GET") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.end(`
        <html>
          <head><title>Centaur Autofill (Dev)</title></head>
          <body>
            <h2>✅ Centaur Autofill (Dev Mode)</h2>
            <p><strong>Booking Link:</strong> ${booking_link}</p>
            <h3>Screenshot:</h3>
            <img src="${dataUrl}" style="max-width:100%;border:1px solid #ccc"/>
            <p style="color:#c00"><em>DEV MODE: Not submitted.</em></p>
          </body>
        </html>
      `);
    }

    return res.status(200).json({
      success: true,
      message: "Autofill successful (no submission)",
      screenshot: dataUrl,
    });
  } catch (error: any) {
    console.error("❌ Puppeteer error:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || String(error),
    });
  } finally {
    if (page) try { await page.close(); } catch {}
    if (browser) try { await browser.close(); } catch {}
  }
}
