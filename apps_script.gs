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
