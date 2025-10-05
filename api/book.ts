import type { VercelRequest, VercelResponse } from "@vercel/node";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

// --- Small helpers ---
async function clickByText(page: any, text: string, scopeXpath: string) {
  const escaped = text.replace(/["']/g, "");
  const [el] = await page.$x(
    `${scopeXpath}//*[contains(normalize-space(text()), "${escaped}")]`
  );
  if (el) {
    await el.click();
    return true;
  }
  return false;
}

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

  const {
    booking_link,
    gender = "Mr.",
    firstName,
    lastName,
    dateOfBirth,
    email,
    phone,
    notes = "",
  } = payload;

  if (!booking_link) {
    return res.status(400).json({ success: false, error: "Missing booking_link" });
  }

  const executablePath = await chromium.executablePath;

  let browser: any;
  let page: any;

  try {
    browser = await puppeteer.launch({
      args: [...chromium.args, "--no-sandbox", "--disable-dev-shm-usage"],
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
      env: {
        ...process.env,
        HOME: "/tmp",
        FONTCONFIG_PATH: "/etc/fonts",
      },
    });

    page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    );

    await page.goto(booking_link, { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector(".signup__container", { timeout: 20000 });

    // --- Autofill fields ---
    try {
      await page.click("div[ng-model='ctrl.user_info.gender'] .selectize-input", {
        delay: 50,
      });
      await page.waitForSelector(".ui-select-choices, .selectize-dropdown", {
        timeout: 5000,
      });
      const clicked = await clickByText(
        page,
        gender,
        "//*[contains(@class,'ui-select-choices') or contains(@class,'selectize-dropdown')]"
      );
      if (!clicked) {
        await page.keyboard.type(gender);
        await page.keyboard.press("Enter");
      }
    } catch (e) {}

    await page.waitForSelector("#firstName", { timeout: 10000 });
    await page.click("#firstName", { clickCount: 3 });
    await page.type("#firstName", firstName || "", { delay: 20 });

    await page.click("#lastName", { clickCount: 3 });
    await page.type("#lastName", lastName || "", { delay: 20 });

    const dobValue = toDdmmyyyy(dateOfBirth || "");
    await page.click("#datepicker", { clickCount: 3 });
    await page.type("#datepicker", dobValue, { delay: 20 });

    await page.click("#msisdn", { clickCount: 3 });
    await page.type("#msisdn", phone || "", { delay: 20 });

    const emailHandle = await page.$("#eMail");
    if (emailHandle) {
      await page.click("#eMail", { clickCount: 3 });
      await page.type("#eMail", email || "", { delay: 20 });
    }

    const notesHandle = await page.$("#notes");
    if (notesHandle) {
      await page.click("#notes", { clickCount: 3 });
      await page.type("#notes", notes, { delay: 10 });
    }

    // --- DEV MODE: no submit ---
    await page.waitForTimeout(1500);
    const png = await page.screenshot({ fullPage: true });
    const dataUrl = `data:image/png;base64,${png.toString("base64")}`;

    if (method === "GET") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.end(`
        <html>
          <head><title>Centaur Autofill (Dev - No Submit)</title></head>
          <body>
            <h2>Centaur Autofill (Dev) — No Submit</h2>
            <p><strong>Booking Link:</strong> ${booking_link}</p>
            <ul>
              <li>Gender: ${gender}</li>
              <li>First Name: ${firstName}</li>
              <li>Last Name: ${lastName}</li>
              <li>DOB: ${dobValue}</li>
              <li>Email: ${email}</li>
              <li>Phone: ${phone}</li>
              <li>Notes: ${notes}</li>
            </ul>
            <h3>Page Screenshot After Autofill</h3>
            <img src="${dataUrl}" style="max-width:100%;border:1px solid #ccc"/>
            <p style="color:#c00"><em>DEV MODE: Form was not submitted.</em></p>
          </body>
        </html>
      `);
    }

    return res
      .status(200)
      .json({ success: true, message: "Fields filled successfully", screenshot: dataUrl });
  } catch (error: any) {
    return res
      .status(500)
      .json({ success: false, error: error?.message || String(error) });
  } finally {
    if (page) try { await page.close(); } catch {}
    if (browser) try { await browser.close(); } catch {}
  }
}
