import type { MenuProps } from 'antd';
import type { ReportCatalog, ReportGroupRecord, ReportRecord } from '../types/report';
import { formatBlockLabelRomanDot } from '../services/reportAppsheet';

export function openKeysForReportId(
  reportId: string | null | undefined,
  reports: Record<string, ReportRecord>
): string[] {
  if (!reportId || !reports[reportId]) {
    return ['/navigation'];
  }

  const report = reports[reportId];
  return ['/navigation', report.blockKey, report.groupKey].filter((key): key is string => Boolean(key));
}

export function parseBlockKeyFromGroupParam(groupKeyParam: string): string | null {
  const trimmed = groupKeyParam.trim();
  const stable = /^group-(bc-[A-Za-z]+)-/i.exec(trimmed);
  if (stable) {
    return stable[1];
  }
  const legacy = /^group-(.+)-(\d+)$/.exec(trimmed);
  return legacy?.[1] ?? null;
}

export function findReportGroup(
  groupKeyParam: string,
  catalog: ReportCatalog
): ReportGroupRecord | null {
  const trimmed = groupKeyParam.trim();
  if (!trimmed) {
    return null;
  }

  const direct = catalog.groups.find(group => group.groupKey === trimmed);
  if (direct) {
    return direct;
  }

  return catalog.groups.find(group => group.legacyGroupKeys?.includes(trimmed)) ?? null;
}

export function openKeysForGroupId(
  groupKey: string | null | undefined,
  catalog: ReportCatalog
): string[] {
  if (!groupKey) {
    return ['/navigation'];
  }

  const group = findReportGroup(groupKey, catalog);
  if (!group) {
    const blockKey = parseBlockKeyFromGroupParam(groupKey);
    if (blockKey && catalog.blocks.some(block => block.blockKey === blockKey)) {
      return ['/navigation', blockKey];
    }
    return ['/navigation'];
  }

  return ['/navigation', group.blockKey];
}

export function openKeysForBlockId(
  blockKey: string | null | undefined,
  catalog: ReportCatalog
): string[] {
  if (!blockKey) {
    return ['/navigation'];
  }

  if (!catalog.blocks.some(block => block.blockKey === blockKey)) {
    return ['/navigation'];
  }

  return ['/navigation', blockKey];
}

export function buildReportMenuItems(catalog: ReportCatalog): NonNullable<MenuProps['items']> {
  const reportsByBlock = new Map<string, ReportRecord[]>();

  Object.values(catalog.reports).forEach(report => {
    const blockReports = reportsByBlock.get(report.blockKey) ?? [];
    blockReports.push(report);
    reportsByBlock.set(report.blockKey, blockReports);
  });

  return catalog.blocks
    .slice()
    .sort((left, right) => left.order - right.order)
    .map(block => {
      const blockReports = reportsByBlock.get(block.blockKey) ?? [];
      const blockGroups = catalog.groups
        .filter(group => group.blockKey === block.blockKey)
        .sort((left, right) => left.order - right.order);

      const groupItems: NonNullable<MenuProps['items']> = blockGroups.map(group => ({
        key: group.groupKey,
        label: group.label,
      }));

      const hasUngroupedReports = blockReports.some(report => !report.groupKey);
      if (hasUngroupedReports) {
        groupItems.push({
          key: `block-reports-${block.blockKey}`,
          label: 'Các báo cáo khác',
        });
      }

      if (groupItems.length === 0) {
        return {
          key: block.blockKey,
          label: formatBlockLabelRomanDot(block.blockLabel),
          disabled: true,
        };
      }

      return {
        key: block.blockKey,
        label: formatBlockLabelRomanDot(block.blockLabel),
        children: groupItems,
      };
    });
}

export function listPeriodsForGroup(
  groupKey: string,
  reports: Record<string, ReportRecord>
): { periodKey: string; periodLabel: string }[] {
  const periods = new Map<string, string>();

  Object.values(reports).forEach(report => {
    if (report.groupKey === groupKey && !periods.has(report.periodKey)) {
      periods.set(report.periodKey, report.periodLabel);
    }
  });

  return Array.from(periods.entries()).map(([periodKey, periodLabel]) => ({
    periodKey,
    periodLabel,
  }));
}

export function listPeriodsForBlock(
  blockKey: string,
  reports: Record<string, ReportRecord>
): { periodKey: string; periodLabel: string }[] {
  const periods = new Map<string, string>();

  Object.values(reports).forEach(report => {
    if (report.blockKey === blockKey && !report.groupKey && !periods.has(report.periodKey)) {
      periods.set(report.periodKey, report.periodLabel);
    }
  });

  return Array.from(periods.entries()).map(([periodKey, periodLabel]) => ({
    periodKey,
    periodLabel,
  }));
}
