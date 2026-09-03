/**
 * บุรีรัมย์ลีก อะคาเดมี่ 2026 — Backend รับลงทะเบียนนักกีฬา → Google ชีต + รูปถ่าย → Drive
 * ============================================================================
 * ฟอร์มลงทะเบียนอยู่ในเว็บ (หน้า register.html) — สคริปต์นี้รับข้อมูลมาลงชีต
 * และรับรูปถ่ายนักกีฬา (ส่งมาเป็น base64) มาเก็บใน Google Drive ให้อัตโนมัติ
 * แล้วบันทึกลิงก์รูปลงคอลัมน์ "ลิงก์รูปถ่ายนักกีฬา"
 *
 * ติดตั้ง / อัปเดตโค้ด (ทำทุกครั้งที่แก้ไฟล์นี้):
 *   1) script.google.com → เปิดโปรเจกต์เดิม → ลบโค้ดเก่าทั้งหมด → วางไฟล์นี้ทั้งหมด → บันทึก
 *   2) Deploy → Manage deployments → ✏️ Edit → Version: "New version" → Deploy
 *      (ครั้งแรกที่ใช้ไฟล์นี้ จะมีการขอสิทธิ์เพิ่มสำหรับ Google Drive — กด Allow)
 *   3) URL /exec เดิมใช้ต่อได้เลย ไม่ต้องแก้ config.registerEndpoint ใหม่
 *   4) เปิด URL /exec ในเบราว์เซอร์ 1 ครั้ง เพื่อดูลิงก์ชีต/CSV/โฟลเดอร์รูป
 */

var SHEET_NAME = 'ทะเบียนนักกีฬา';
var PHOTO_FOLDER_NAME = 'BLA 2026 - รูปถ่ายนักกีฬา';
var HEADERS = [
  'ประทับเวลา', 'ชื่อสโมสร', 'รุ่นอายุ', 'ชื่อ-นามสกุลนักกีฬา', 'วันเดือนปีเกิด',
  'เลขบัตร ปชช./เลขนักเรียน', 'เบอร์เสื้อ', 'ชื่อผู้ปกครอง', 'เบอร์ติดต่อผู้ปกครอง', 'ลิงก์รูปถ่ายนักกีฬา'
];

function getSheet_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SS_ID');
  var ss;
  if (id) {
    ss = SpreadsheetApp.openById(id);
  } else {
    ss = SpreadsheetApp.create('BLA 2026 — ทะเบียนนักกีฬา (จากเว็บ)');
    props.setProperty('SS_ID', ss.getId());
  }
  var sh = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  sh.setName(SHEET_NAME);
  if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
  return sh;
}

function getPhotoFolder_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('PHOTO_FOLDER_ID');
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (ignore) {}
  }
  var folder = DriveApp.createFolder(PHOTO_FOLDER_NAME);
  props.setProperty('PHOTO_FOLDER_ID', folder.getId());
  return folder;
}

/* รับรูป base64 (data URL) → บันทึกลง Drive → คืนลิงก์รูปที่ฝังใน <img> ได้ */
function savePhoto_(dataUrl, fileName, athleteName) {
  if (!dataUrl) return '';
  var m = String(dataUrl).match(/^data:([^;]+);base64,(.*)$/);
  if (!m) return '';
  var mime = m[1], b64 = m[2];
  var bytes = Utilities.base64Decode(b64);
  var safeName = (athleteName || 'นักกีฬา').replace(/[\\/:*?"<>|]/g, '') + ' - ' + (fileName || 'photo.jpg');
  var blob = Utilities.newBlob(bytes, mime, safeName);
  var file = getPhotoFolder_().createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  // ลิงก์รูปที่ฝังใน <img> ข้ามโดเมนได้จริง (เว็บบนเน็ตลิฟายเรียกดูได้)
  // lh3.googleusercontent.com เสิร์ฟ image พร้อม CORS อนุญาต ไม่มี CORP บล็อก
  return 'https://lh3.googleusercontent.com/d/' + file.getId() + '=w1000';
}

/* บังคับเก็บเป็นข้อความ (กันเลข 0 หน้าหาย เช่น เบอร์โทร / เลขบัตร ปชช.) */
function txt_(v) {
  v = (v == null ? '' : String(v)).trim();
  return v ? "'" + v : '';
}

/* รับข้อมูลจากฟอร์มในเว็บ */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var p = (e && e.parameter) || {};
    var photoUrl = '';
    try {
      photoUrl = savePhoto_(p['รูปภาพ'], p['ชื่อไฟล์รูป'], p['ชื่อ-นามสกุลนักกีฬา']);
    } catch (photoErr) {
      photoUrl = ''; // บันทึกข้อมูลต่อได้แม้บันทึกรูปพลาด
    }
    getSheet_().appendRow([
      new Date(),
      p['ชื่อสโมสร'] || '',
      p['รุ่นอายุ'] || '',
      p['ชื่อ-นามสกุลนักกีฬา'] || '',
      txt_(p['วันเดือนปีเกิด']),
      txt_(p['เลขบัตร']),
      txt_(p['เบอร์เสื้อ']),
      p['ชื่อผู้ปกครอง'] || '',
      txt_(p['เบอร์ติดต่อผู้ปกครอง']),
      photoUrl
    ]);
    return json_({ ok: true, photoUrl: photoUrl });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

/* เปิดในเบราว์เซอร์เพื่อดูสถานะ + ลิงก์ชีต/CSV/โฟลเดอร์รูป */
function doGet() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('SS_ID')) getSheet_();
  var id = props.getProperty('SS_ID');
  var ss = SpreadsheetApp.openById(id);
  var sh = ss.getSheetByName(SHEET_NAME);
  var n = Math.max(0, sh.getLastRow() - 1);
  var csv = 'https://docs.google.com/spreadsheets/d/' + id + '/export?format=csv';
  var folderUrl = getPhotoFolder_().getUrl();
  var css = "font-family:system-ui,'Kanit',sans-serif;max-width:720px;margin:32px auto;padding:0 16px;line-height:1.7;color:#0A1B3D";
  var ta = "width:100%;padding:10px;font:13px/1.4 monospace;border:1px solid #cbd5e1;border-radius:8px";
  var html =
    '<div style="' + css + '">' +
      '<h2>บุรีรัมย์ลีก อะคาเดมี่ — ระบบรับลงทะเบียน (พร้อมใช้งาน ✔)</h2>' +
      '<p>ลงทะเบียนแล้ว <b>' + n + '</b> คน</p>' +
      '<p><b>ชีตทะเบียนนักกีฬา</b><br><a href="' + ss.getUrl() + '" target="_blank">' + ss.getUrl() + '</a></p>' +
      '<p><b>โฟลเดอร์รูปถ่ายนักกีฬา</b><br><a href="' + folderUrl + '" target="_blank">' + folderUrl + '</a></p>' +
      '<p><b>ลิงก์ CSV</b> — วางที่ <code>config.athleteSheetCsvUrl</code> ใน <code>assets/js/data.js</code> ' +
        '(ต้องตั้งสิทธิ์แชร์ชีตเป็น "ทุกคนที่มีลิงก์ · ผู้อ่าน" ก่อน จึงจะให้หน้าออกบัตรดึงอัตโนมัติได้)<br>' +
        '<textarea style="' + ta + '" rows="2" onclick="this.select()">' + csv + '</textarea></p>' +
      '<hr><p style="color:#64748b;font-size:13px">URL ของหน้านี้ (ลงท้าย /exec) = ค่าที่ต้องวางใน <code>config.registerEndpoint</code></p>' +
    '</div>';
  return HtmlService.createHtmlOutput(html).setTitle('BLA — ระบบรับลงทะเบียน');
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
