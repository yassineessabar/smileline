import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method || 'GET';

  // Demo data for GET testing
  const demoPayload = {
    booking_link: "https://www.centaurportal.com/d4w/org-394/signup?time_id=1295778291_-1&shortVer=false&sourceID=null",
    gender: "Ms.",
    firstName: "Yassine",
    lastName: "Essabar",
    dateOfBirth: "1992-08-18",
    email: "essabar.yassine@gmail.com",
    phone: "0478505348",
    notes: "Test booking via automation (no submit)"
  };

  const payload = method === 'POST' && req.body && Object.keys(req.body).length
    ? req.body
    : demoPayload;

  if (method === 'GET') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(`
      <html>
        <head><title>Centaur Autofill Test</title></head>
        <body>
          <h2>Centaur Autofill API Test</h2>
          <p><strong>Status:</strong> API is working!</p>
          <p><strong>Booking Link:</strong> ${payload.booking_link}</p>
          <ul>
            <li>Gender: ${payload.gender}</li>
            <li>First Name: ${payload.firstName}</li>
            <li>Last Name: ${payload.lastName}</li>
            <li>DOB: ${payload.dateOfBirth}</li>
            <li>Email: ${payload.email}</li>
            <li>Phone: ${payload.phone}</li>
            <li>Notes: ${payload.notes}</li>
          </ul>
          <p style="color:#090"><em>Basic API structure is working. Puppeteer integration pending.</em></p>
        </body>
      </html>
    `);
  }

  return res.status(200).json({
    success: true,
    message: 'API structure working, Puppeteer integration pending',
    payload
  });
}