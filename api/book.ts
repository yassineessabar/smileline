import { chromium as pwChromium } from "playwright-core";
import chromium from "@sparticuz/chromium";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const payload = {
    booking_link:
      "https://www.centaurportal.com/d4w/org-394/signup?time_id=1295778291_-1&shortVer=false&sourceID=null",
    firstName: "Yassine",
    lastName: "Essabar",
    dateOfBirth: "1992-08-18",
    phone: "0478505348",
    email: "essabar.yassine@gmail.com",
  };

  let browser: any;
  let page: any;

  try {
    // ✅ Detect environment
    const isProd = process.env.VERCEL === "1";
    let launchOptions: any;

    if (isProd) {
      const execPath = await chromium.executablePath();
      launchOptions = {
        args: chromium.args,
        executablePath: execPath,
        headless: chromium.headless,
      };
    } else {
      launchOptions = { headless: true };
    }

    // ✅ Launch browser
    browser = await pwChromium.launch(launchOptions);
    page = await browser.newPage();

    await page.goto(payload.booking_link, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector(".signup__container", { timeout: 20000 });

    await page.fill("#firstName", payload.firstName);
    await page.fill("#lastName", payload.lastName);
    await page.fill("#datepicker", "18/08/1992");
    await page.fill("#msisdn", payload.phone);
    const emailField = await page.$("#eMail");
    if (emailField) await emailField.fill(payload.email);

    const screenshot = await page.screenshot({ fullPage: true });
    const dataUrl = `data:image/png;base64,${screenshot.toString("base64")}`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(`
      <html><body>
        <h2>✅ Centaur Autofill (Serverless Fixed)</h2>
        <img src="${dataUrl}" style="max-width:100%;border:1px solid #ccc"/>
      </body></html>
    `);
  } catch (err: any) {
    console.error("❌ Error:", err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (page) await page.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
}
