import 'dotenv/config';

const appId = process.env.APPSHEET_APP_ID?.replace(/^["']|["']$/g, '');
const accessKey = process.env.APPSHEET_ACCESS_KEY?.replace(/^["']|["']$/g, '');
const host = process.env.APPSHEET_REGION_HOST?.replace(/^["']|["']$/g, '') || 'www.appsheet.com';

async function invoke(table, action, rows) {
  const url = `https://${host}/api/v2/apps/${encodeURIComponent(appId)}/tables/${encodeURIComponent(table)}/Action`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { ApplicationAccessKey: accessKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Action: action,
      Properties: { Locale: 'vi-VN', Timezone: 'SE Asia Standard Time' },
      Rows: rows,
    }),
  });
  const text = await res.text();
  console.log(table, action, JSON.stringify(rows), '->', res.status, text.slice(0, 350));
}

await invoke('I.1', 'Edit', [{ TT: '4', 'TIẾN ĐỘ': 'Đang thực hiện' }]);
await invoke('I.1', 'Add', [{
  TT: '99',
  'CÔNG VIỆC': 'test add',
  'NGƯỜI ĐƯỢC GIAO': 'test',
  'Y/C XONG': '06/30/2026',
}]);

await invoke('BC định kỳ', 'Add', [{
  id: 'test-new-1',
  Mã: 'I',
  'Loại báo cáo': 'TEST',
  'Tên báo cáo': 'API test add with id',
}]);
