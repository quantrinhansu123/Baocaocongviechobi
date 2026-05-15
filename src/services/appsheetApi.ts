export type AppsheetStatus = {
  configured: boolean;
  connected: boolean;
  appId?: string;
  table?: string;
  rowCount?: number;
  deploymentId?: string | null;
  message?: string;
};

export type AppsheetFindResponse = {
  table: string;
  rows: Record<string, unknown>[];
  raw: unknown;
};

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) {
    return {} as T;
  }
  return JSON.parse(text) as T;
}

export async function fetchAppsheetStatus(): Promise<AppsheetStatus> {
  const response = await fetch('/api/appsheet/status');
  return parseJson<AppsheetStatus>(response);
}

export async function findAppsheetTasks(options?: {
  table?: string;
  selector?: string;
  rows?: Record<string, unknown>[];
}): Promise<AppsheetFindResponse> {
  const params = new URLSearchParams();
  if (options?.table) {
    params.set('table', options.table);
  }
  if (options?.selector) {
    params.set('selector', options.selector);
  }

  const response = await fetch(`/api/appsheet/find${params.size ? `?${params}` : ''}`);

  if (!response.ok) {
    const payload = await parseJson<{ message?: string }>(response);
    throw new Error(payload.message ?? `AppSheet find failed with HTTP ${response.status}.`);
  }

  return parseJson<AppsheetFindResponse>(response);
}

export async function addAppsheetTask(
  row: Record<string, unknown>,
  table?: string
): Promise<unknown> {
  const response = await fetch('/api/appsheet/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table, rows: [row] }),
  });

  if (!response.ok) {
    const payload = await parseJson<{ message?: string }>(response);
    throw new Error(payload.message ?? `AppSheet add failed with HTTP ${response.status}.`);
  }

  return parseJson(response);
}

export async function editAppsheetTask(
  row: Record<string, unknown>,
  table?: string
): Promise<unknown> {
  const response = await fetch('/api/appsheet/edit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table, rows: [row] }),
  });

  if (!response.ok) {
    const payload = await parseJson<{ message?: string }>(response);
    throw new Error(payload.message ?? `AppSheet edit failed with HTTP ${response.status}.`);
  }

  return parseJson(response);
}

export async function deleteAppsheetTask(
  row: Record<string, unknown>,
  table?: string
): Promise<unknown> {
  const response = await fetch('/api/appsheet/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table, rows: [row] }),
  });

  if (!response.ok) {
    const payload = await parseJson<{ message?: string }>(response);
    throw new Error(payload.message ?? `AppSheet delete failed with HTTP ${response.status}.`);
  }

  return parseJson(response);
}
