import type { AppsheetAction, AppsheetConfig } from './appsheetConfig';

export type AppsheetRequestBody = {
  Action: AppsheetAction;
  Properties?: Record<string, unknown>;
  Rows?: Record<string, unknown>[];
};

export type AppsheetFindResult = {
  rows: Record<string, unknown>[];
  raw: unknown;
};

function buildAppsheetUrl(config: AppsheetConfig, tableName: string): string {
  const appId = encodeURIComponent(config.appId);
  const table = encodeURIComponent(tableName);
  return `https://${config.regionHost}/api/v2/apps/${appId}/tables/${table}/Action`;
}

function defaultProperties(config: AppsheetConfig, extra?: Record<string, unknown>) {
  return {
    Locale: config.locale,
    Timezone: config.timezone,
    ...extra,
  };
}

function parseAppsheetRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload as Record<string, unknown>[];
  }

  if (payload && typeof payload === 'object' && Array.isArray((payload as { Rows?: unknown }).Rows)) {
    return (payload as { Rows: Record<string, unknown>[] }).Rows;
  }

  return [];
}

function parseAppsheetErrorMessage(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return '';
  }

  try {
    const payload = JSON.parse(trimmed) as { detail?: string; message?: string };
    if (payload.detail) {
      return payload.detail;
    }

    if (payload.message) {
      try {
        const nested = JSON.parse(payload.message) as { detail?: string };
        if (nested.detail) {
          return nested.detail;
        }
      } catch {
        return payload.message;
      }
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}

export async function invokeAppsheetAction(
  config: AppsheetConfig,
  tableName: string,
  body: AppsheetRequestBody
): Promise<unknown> {
  const response = await fetch(buildAppsheetUrl(config, tableName), {
    method: 'POST',
    headers: {
      ApplicationAccessKey: config.accessKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(parseAppsheetErrorMessage(text) || `AppSheet API trả về HTTP ${response.status}.`);
  }

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function findAppsheetRows(
  config: AppsheetConfig,
  tableName: string,
  options?: {
    selector?: string;
    rows?: Record<string, unknown>[];
    properties?: Record<string, unknown>;
  }
): Promise<AppsheetFindResult> {
  const properties: Record<string, unknown> = defaultProperties(config, options?.properties);
  if (options?.selector) {
    properties.Selector = options.selector;
  }

  const raw = await invokeAppsheetAction(config, tableName, {
    Action: 'Find',
    Properties: properties,
    Rows: options?.rows ?? [],
  });

  return {
    rows: parseAppsheetRows(raw),
    raw,
  };
}

export async function addAppsheetRows(
  config: AppsheetConfig,
  tableName: string,
  rows: Record<string, unknown>[]
): Promise<unknown> {
  return invokeAppsheetAction(config, tableName, {
    Action: 'Add',
    Properties: defaultProperties(config),
    Rows: rows,
  });
}

export async function editAppsheetRows(
  config: AppsheetConfig,
  tableName: string,
  rows: Record<string, unknown>[]
): Promise<unknown> {
  return invokeAppsheetAction(config, tableName, {
    Action: 'Edit',
    Properties: defaultProperties(config),
    Rows: rows,
  });
}

export async function deleteAppsheetRows(
  config: AppsheetConfig,
  tableName: string,
  rows: Record<string, unknown>[]
): Promise<unknown> {
  return invokeAppsheetAction(config, tableName, {
    Action: 'Delete',
    Properties: defaultProperties(config),
    Rows: rows,
  });
}
