/** CLES v1.7.0 Google Apps Script receiver. Bind this script to a Google Sheet. */
const SHEET_NAME = 'CLES_LOG';
const HEADERS = ['event_id','ts','received_at','session_id','item_index','item_id','type','theme','title','chunk','answer','correct_answer','ok','time_sec','timeout','mastery_score','user_profile','app_mode','app_version','question_bank_version','week_id','device_id','os','browser','screen','touch_points'];
function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName(SHEET_NAME);
    if (!sh) sh = ss.insertSheet(SHEET_NAME);
    if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
    const last = sh.getLastRow();
    const existing = new Set(last > 1 ? sh.getRange(2,1,last-1,1).getValues().flat().filter(String) : []);
    const received = new Date().toISOString();
    const out = [];
    rows.forEach(r => {
      if (!r || !r.event_id || existing.has(r.event_id)) return;
      const d=r.device_info||{};
      out.push([r.event_id,r.ts||'',received,r.session_id||'',r.item_index||'',r.item_id||'',r.type||'',r.theme||'',r.title||'',r.chunk||'',r.answer||'',r.correct_answer||'',r.ok===true,r.time_sec??'',r.timeout===true,r.mastery_score??'',r.user_profile||'',r.app_mode||'',r.app_version||'',r.question_bank_version||'',r.week_id||'',d.device_id||'',d.os||'',d.browser||'',d.screen||'',d.touch_points??'']);
      existing.add(r.event_id);
    });
    if(out.length) sh.getRange(sh.getLastRow()+1,1,out.length,HEADERS.length).setValues(out);
    return ContentService.createTextOutput(JSON.stringify({ok:true,received:rows.length,inserted:out.length})).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:String(err)})).setMimeType(ContentService.MimeType.JSON);
  }
}
