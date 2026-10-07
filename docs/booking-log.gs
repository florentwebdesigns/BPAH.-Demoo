/**
 * Basco Plumbing & Heating: booking log
 *
 * Saves every booking text started from the website as a row in this Google Sheet.
 * Setup: in the Sheet, Extensions > Apps Script, paste this file, then
 * Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone).
 * Copy the web app URL into BOOKING_LOG_URL in index.html.
 */
var SHEET_NAME = "Bookings";
var HEADERS = ["Received", "Source", "Name", "Phone", "Service", "Address", "Problem", "Device", "Page"];

function doPost(e) {
  var p = (e && e.parameter) || {};
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
  // Text only: a value starting with = + - @ would otherwise run as a formula.
  var clean = function (v) {
    v = String(v || "").slice(0, 2000);
    return /^[=+\-@]/.test(v) ? "'" + v : v;
  };
  sh.appendRow([new Date(), clean(p.source), clean(p.name), clean(p.phone), clean(p.service),
    clean(p.address), clean(p.message), clean(p.device), clean(p.page)]);
  return ContentService.createTextOutput("ok");
}
