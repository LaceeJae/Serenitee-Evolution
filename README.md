# Serenitee Evolution — Final Site Package

## Contents
- index.html — frontend site + booking calendar
- styles.css
- script.js — includes GOOGLE_SHEETS_URL placeholder and demo booked slots
- assets/logo.png — your logo (if provided)
- apps_script.gs — Google Apps Script to paste into Apps Script editor (included below)
- sample_bookings.csv — a sample CSV you can import into Google Sheets
- README.md (this file)

---
## Quick Google Apps Script setup (copy the code from apps_script.gs below)

Paste this into **Extensions → Apps Script** for your Booking Sheet and **Deploy → New deployment → Web app**.
Make sure to set **Execute as: Me** and **Who has access: Anyone**.
Then paste the Web App URL into `script.js` for `GOOGLE_SHEETS_URL` and into PayPal IPN settings.

---
### apps_script.gs (paste this entire file)
// Google Apps Script for Serenitee Evolution bookings + PayPal IPN
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  try {
    // If POSTed JSON from site, e.postData.contents will be JSON
    if (e.postData && e.postData.type === "application/json") {
      var data = JSON.parse(e.postData.contents);
      sheet.appendRow([data.date, data.time, data.name, data.email, data.notes || '', 'Pending']);
      return ContentService.createTextOutput(JSON.stringify({status: 'booking logged'})).setMimeType(ContentService.MimeType.JSON);
    } else {
      // Handle PayPal IPN (form-encoded parameters)
      var params = e.parameter;
      var payerEmail = params.payer_email || params.payer_email;
      var paymentStatus = params.payment_status || '';
      var mcGross = params.mc_gross || params['mc_gross'] || '';
      // Only mark Paid for completed $35 payments (adjust currency checks if needed)
      if (paymentStatus === 'Completed' && (mcGross === '35.00' || mcGross === '35')) {
        // Find the most recent row with matching email and Pending status
        var data = sheet.getDataRange().getValues();
        for (var i = data.length - 1; i >= 1; i--) {
          var row = data[i];
          var rowEmail = row[3];
          var status = row[5];
          if (rowEmail === payerEmail && status === 'Pending') {
            sheet.getRange(i+1, 6).setValue('Paid');
            break;
          }
        }
      }
      return ContentService.createTextOutput('IPN processed');
    }
  } catch (err) {
    return ContentService.createTextOutput('Error: ' + err);
  }
}


---
## sample_bookings.csv (included in ZIP)
Headers: Date,Time,Name,Email,Notes,Deposit Paid

---
## How it works
1. User selects date/time and submits booking form.
2. The site POSTs JSON to your Apps Script URL (if set) — Apps Script appends a row with 'Pending' status.
3. User pays $35 deposit via PayPal button. Configure PayPal IPN to send notifications to the same Apps Script URL.
4. When PayPal sends IPN (payment notification), Apps Script looks for the most recent Pending booking with the payer's email and marks it 'Paid'.
5. You manually add booked slots to `bookedSlots` in `script.js` to mark them visually on the calendar.

---
## Deploying on Cloudflare Pages
- Upload the unzipped folder to a Git repo and connect to Cloudflare Pages, or upload via Cloudflare's UI. No build step required.

---
If you'd like, I can also:
- Add a simple admin page that reads the Google Sheet and toggles `bookedSlots` without editing code (would require Apps Script endpoints).
- Auto-block slots directly from the Sheet by maintaining a 'Blocked Slots' sheet and fetching it from the frontend (requires enabling CORS via Apps Script).

