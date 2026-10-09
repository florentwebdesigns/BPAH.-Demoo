/**
 * Basco Plumbing & Heating: booking log
 *
 * Saves every booking form sent from the website as a row on the "Bookings" tab,
 * and every Call button tap on the "Calls" tab.
 * Setup: in the Sheet, Extensions > Apps Script, paste this file, then
 * Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone).
 * Copy the web app URL into BOOKING_LOG_URL in index.html.
 */
var BOOKINGS = { name: "Bookings", headers: ["Received", "Source", "Name", "Phone", "Service", "Address", "Problem", "Device", "Page"] };
var CALLS = { name: "Calls", headers: ["Tapped Call", "Device", "Page"] };

function tab_(ss, spec) {
  var sh = ss.getSheetByName(spec.name) || ss.insertSheet(spec.name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(spec.headers);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, spec.headers.length).setFontWeight("bold");
  }
  return sh;
}

function doPost(e) {
  var p = (e && e.parameter) || {};
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  // Text only: a value starting with = + - @ would otherwise run as a formula.
  var clean = function (v) {
    v = String(v || "").slice(0, 2000);
    return /^[=+\-@]/.test(v) ? "'" + v : v;
  };
  if (p.source === "Call button") {
    tab_(ss, CALLS).appendRow([new Date(), clean(p.device), clean(p.page)]);
  } else {
    tab_(ss, BOOKINGS).appendRow([new Date(), clean(p.source), clean(p.name), clean(p.phone), clean(p.service),
      clean(p.address), clean(p.message), clean(p.device), clean(p.page)]);
  }
  return ContentService.createTextOutput("ok");
}
