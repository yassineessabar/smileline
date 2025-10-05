import type { VercelRequest, VercelResponse } from "@vercel/node";
import { chromium } from "playwright-core";

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

  // 🧩 Only what the client provides
  const {
    booking_link,
    gender,
    firstName,
    lastName,
    dateOfBirth,
    email,
    phone,
    notes,
  } = input as Record<string, string>;

  if (!booking_link) {
    return res.status(400).json({ success: false, error: "Missing booking_link" });
  }

  let browser;
  try {
    // ✅ Launch lightweight Playwright chromium (works on Vercel)
    browser = await chromium.launch({
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(booking_link, { waitUntil: "networkidle", timeout: 60000 });

    // Wait for the form container
    await page.waitForSelector(".signup__container", { timeout: 20000 });

    // Fill provided fields
    if (gender) {
      try {
        await page.click("div[ng-model='ctrl.user_info.gender'] .selectize-input");
        await page.waitForTimeout(500);
        await page.locator(`text=${gender}`).first().click();
      } catch {
        // Optional
      }
    }
    if (firstName) await page.fill("#firstName", firstName);
    if (lastName) await page.fill("#lastName", lastName);
    if (dateOfBirth) await page.fill("#datepicker", toDdmmyyyy(dateOfBirth));
    if (phone) await page.fill("#msisdn", phone);
    if (email) await page.fill("#eMail", email);
    if (notes) await page.fill("#notes", notes);

    await page.waitForTimeout(1500);

    // Screenshot for verification
    const screenshot = await page.screenshot({ fullPage: true });
    const base64 = screenshot.toString("base64");

    // HTML preview
    const htmlPreview = `
      <html>
        <head><title>✅ Centaur Autofill (Playwright)</title></head>
        <body style="font-family:sans-serif;">
          <h2>✅ Centaur Autofill (Playwright)</h2>
          <p><strong>Booking Link:</strong> ${booking_link}</p>
          <ul>
            ${firstName ? `<li>First Name: ${firstName}</li>` : ""}
            ${lastName ? `<li>Last Name: ${lastName}</li>` : ""}
            ${email ? `<li>Email: ${email}</li>` : ""}
            ${phone ? `<li>Phone: ${phone}</li>` : ""}
            ${notes ? `<li>Notes: ${notes}</li>` : ""}
          </ul>
          <h3>Screenshot After Autofill</h3>
          <img src="data:image/png;base64,${base64}" style="max-width:100%;border:1px solid #ccc"/>
          <p style="color:#c00"><em>Form filled but not submitted (dev mode)</em></p>
        </body>
      </html>
    `;

    if (method === "GET") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(200).send(htmlPreview);
    } else {
      res.status(200).json({
        success: true,
        message: "Form filled successfully (no submit)",
        screenshot: `data:image/png;base64,${base64}`,
      });
    }
  } catch (err: any) {
    console.error("❌ Error:", err);
    res.status(500).json({ success: false, error: err.message || String(err) });
  } finally {
    if (browser) await browser.close();
  }
}
