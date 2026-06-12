const base = 'http://localhost:3001';

async function post(path, rows, table) {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table, rows }),
  });
  const text = await res.text();
  console.log(table, path, res.status, text.slice(0, 300));
}

// Task row without id column (like I.1 API response)
await post('/api/appsheet/edit', [{ _RowNumber: '5', 'TIẾN ĐỘ': 'Đang thực hiện' }], 'I.1');
await post('/api/appsheet/edit', [{ 'TIẾN ĐỘ': 'Đang thực hiện' }], 'I.1');

// Report add without id
await post('/api/appsheet/add', [{
  Mã: 'I',
  'Loại báo cáo': 'TEST',
  'Tên báo cáo': 'API test',
}], 'BC định kỳ');
