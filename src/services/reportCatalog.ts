import { findAppsheetTasks } from './appsheetApi';
import { getReportAppsheetTableName, mapAppsheetRowsToReportCatalog } from './reportAppsheet';
import type { ReportCatalog } from '../types/report';

let cachedCatalog: ReportCatalog | null = null;

export async function loadReportCatalog(options?: { force?: boolean }): Promise<ReportCatalog> {
  if (!options?.force && cachedCatalog) {
    return cachedCatalog;
  }

  const result = await findAppsheetTasks({ table: getReportAppsheetTableName() });
  cachedCatalog = mapAppsheetRowsToReportCatalog(result.rows);
  return cachedCatalog;
}
