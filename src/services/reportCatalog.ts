import { findAppsheetTasks } from './appsheetApi';
import { getReportAppsheetTableName, mapAppsheetRowsToReportCatalog } from './reportAppsheet';
import type { ReportCatalog } from '../types/report';

let cachedCatalog: ReportCatalog | null = null;
let catalogCacheVersion = 0;

/** Tăng khi đổi format nhãn menu — buộc tải lại catalog sau deploy */
const CATALOG_FORMAT_VERSION = 8;

export async function loadReportCatalog(options?: { force?: boolean }): Promise<ReportCatalog> {
  if (!options?.force && cachedCatalog && catalogCacheVersion === CATALOG_FORMAT_VERSION) {
    return cachedCatalog;
  }

  const result = await findAppsheetTasks({ table: getReportAppsheetTableName() });
  cachedCatalog = mapAppsheetRowsToReportCatalog(result.rows);
  catalogCacheVersion = CATALOG_FORMAT_VERSION;
  return cachedCatalog;
}
