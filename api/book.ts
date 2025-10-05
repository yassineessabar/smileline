import type { VercelRequest, VercelResponse } from "@vercel/node";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

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

  const payload = {
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

  // 1️⃣ Quick ping test (like /api/test)
  if (req.query.ping === "1") {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end(`
      <html>
        <head><title>Centaur Autofill API</title></head>
        <body>
          <h2>Centaur Autofill API — Ping OK ✅</h2>
          <p>This confirms that the function runtime works.</p>
          <p>Chromium integration runs only on full requests.</p>
        </body>
      </html>
    `);
  }

  let browser: any;
  let page: any;

  try {
    console.log("🧠 Launching Chromium...");

    const executablePath = await chromium.executablePath(
      "https://github.com/Sparticuz/chromium/releases/download/v122.0.0/chromium-v122.0.0-pack.tar.br"
    );

    browser = await puppeteer.launch({
      args: [...chromium.args, "--no-sandbox", "--disable-dev-shm-usage"],
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    });

    page = await browser.newPage();
    await page.goto(payload.booking_link, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });

    await page.waitForSelector(".signup__container", { timeout: 15000 });
    await page.type("#firstName", payload.firstName, { delay: 15 });
    await page.type("#lastName", payload.lastName, { delay: 15 });
    await page.type("#datepicker", toDdmmyyyy(payload.dateOfBirth), { delay: 15 });
    await page.type("#msisdn", payload.phone, { delay: 15 });

    const png = await page.screenshot({ fullPage: true });
    const dataUrl = `data:image/png;base64,${png.toString("base64")}`;

    return res.status(200).send(`
      <html>
        <head><title>✅ Centaur Autofill (Dev)</title></head>
        <body>
          <h2>✅ Centaur Autofill (Dev)</h2>
          <img src="${dataUrl}" style="max-width:100%;border:1px solid #ccc"/>
          <p><em>Form autofilled — no submission</em></p>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error("❌ Puppeteer failed:", error);

    // 2️⃣ Fallback to simple test-style response
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end(`
      <html>
        <head><title>Centaur Autofill (Fallback)</title></head>
        <body>
          <h2>⚠️ Chromium launch failed, but API works.</h2>
          <p>${error.message}</p>
          <hr>
          <h3>Test Payload</h3>
          <ul>
            <li>Name: ${payload.firstName} ${payload.lastName}</li>
            <li>DOB: ${payload.dateOfBirth}</li>
            <li>Email: ${payload.email}</li>
          </ul>
          <p style="color:#090"><em>Serverless runtime OK — Puppeteer fallback.</em></p>
        </body>
      </html>
    `);
  } finally {
    if (page) try { await page.close(); } catch {}
    if (browser) try { await browser.close(); } catch {}
  }
}
