import { findDataRows } from './dataApi';
import { getReportTableName, mapRowsToReportCatalog, mergeReportCatalogWithDefaults } from './reportData';
import type { ReportCatalog } from '../types/report';

let cachedCatalog: ReportCatalog | null = null;
let catalogCacheVersion = 0;

/** Tăng khi đổi format nhãn menu — buộc tải lại catalog sau deploy */
const CATALOG_FORMAT_VERSION = 9;

export async function loadReportCatalog(options?: { force?: boolean }): Promise<ReportCatalog> {
  if (!options?.force && cachedCatalog && catalogCacheVersion === CATALOG_FORMAT_VERSION) {
    return cachedCatalog;
  }

  const result = await findDataRows({ table: getReportTableName() });
  cachedCatalog = mergeReportCatalogWithDefaults(mapRowsToReportCatalog(result.rows));
  catalogCacheVersion = CATALOG_FORMAT_VERSION;
  return cachedCatalog;
}
