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
  const demo = {
    booking_link:
      "https://www.centaurportal.com/d4w/org-394/signup?time_id=1295778291_-1&shortVer=false&sourceID=null",
    firstName: "Yassine",
    lastName: "Essabar",
    dateOfBirth: "1992-08-18",
    email: "essabar.yassine@gmail.com",
    phone: "0478505348",
  };
  const payload =
    method === "POST" && req.body && Object.keys(req.body).length
      ? req.body
      : demo;

  const { booking_link, firstName, lastName, dateOfBirth, email, phone } =
    payload;

  let browser: any;
  let page: any;

  try {
    console.log("⚙️  Preparing Chromium...");

    // Try both hosted and local extraction path
    let executablePath: string;
    try {
      executablePath = await chromium.executablePath(
        "https://github.com/Sparticuz/chromium/releases/download/v122.0.0/chromium-v122.0.0-pack.tar.br"
      );
    } catch {
      executablePath = await chromium.executablePath();
    }

    console.log("✅ Chromium ready at:", executablePath);

    browser = await puppeteer.launch({
      args: [...chromium.args, "--no-sandbox", "--disable-dev-shm-usage"],
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    });

    page = await browser.newPage();
    console.log("🌐 Opening:", booking_link);
    await page.goto(booking_link, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });

    await page.waitForSelector(".signup__container", { timeout: 15000 });
    console.log("✅ Page loaded, filling form...");

    await page.type("#firstName", firstName || "", { delay: 10 });
    await page.type("#lastName", lastName || "", { delay: 10 });
    await page.type("#datepicker", toDdmmyyyy(dateOfBirth), { delay: 10 });
    await page.type("#msisdn", phone || "", { delay: 10 });

    const emailField = await page.$("#eMail");
    if (emailField) await emailField.type(email || "", { delay: 10 });

    await page.waitForTimeout(1000);
    console.log("📸 Taking screenshot...");
    const png = await page.screenshot({ fullPage: true });
    const dataUrl = `data:image/png;base64,${png.toString("base64")}`;

    if (method === "GET") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.end(`
        <html>
          <head><title>Centaur Autofill (Dev Mode)</title></head>
          <body>
            <h2>✅ Centaur Autofill (Dev Mode)</h2>
            <img src="${dataUrl}" style="max-width:100%;border:1px solid #ccc"/>
            <p style="color:#c00"><em>Form filled automatically (no submit)</em></p>
          </body>
        </html>
      `);
    }

    return res.status(200).json({
      success: true,
      message: "Autofill completed (no submit)",
      screenshot: dataUrl,
    });
  } catch (err: any) {
    console.error("❌ Error:", err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    if (page) try { await page.close(); } catch {}
    if (browser) try { await browser.close(); } catch {}
  }
}
