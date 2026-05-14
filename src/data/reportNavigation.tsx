import React from 'react';
import type { MenuProps } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import type { ReportCatalog, ReportRecord } from '../types/report';

const monoIcon = (node: React.ReactElement<{ className?: string }>) =>
  React.cloneElement(node, {
    className: ['sidebar-nav-icon', node.props.className].filter(Boolean).join(' '),
  });

function placeholderChildren(emptyKey: string): NonNullable<MenuProps['items']> {
  return [
    {
      key: emptyKey,
      label: 'Chưa có báo cáo',
      disabled: true,
    },
  ];
}

function buildPeriodMenuItems(reports: ReportRecord[]): NonNullable<MenuProps['items']> {
  const periods = new Map<string, { label: string; reports: ReportRecord[] }>();

  reports.forEach(report => {
    if (!periods.has(report.periodKey)) {
      periods.set(report.periodKey, {
        label: report.periodLabel,
        reports: [],
      });
    }

    periods.get(report.periodKey)!.reports.push(report);
  });

  return Array.from(periods.entries()).map(([periodKey, period]) => ({
    key: periodKey,
    label: period.label,
    children: period.reports
      .sort((left, right) => left.stt - right.stt)
      .map(report => ({
        key: `report-${report.key}`,
        icon: monoIcon(<FileTextOutlined />),
        label: report.menuLabel,
      })),
  }));
}

export function openKeysForReportId(
  reportId: string | null | undefined,
  reports: Record<string, ReportRecord>
): string[] {
  if (!reportId || !reports[reportId]) {
    return ['/navigation'];
  }

  const report = reports[reportId];
  return ['/navigation', report.blockKey, report.groupKey, report.periodKey].filter(
    (key): key is string => Boolean(key)
  );
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

      if (blockGroups.length > 0) {
        const groupChildren = blockGroups.map(group => {
          const groupReports = blockReports.filter(report => report.groupKey === group.groupKey);
          const periodChildren = buildPeriodMenuItems(groupReports);

          return {
            key: group.groupKey,
            label: group.label,
            children:
              periodChildren.length > 0
                ? periodChildren
                : placeholderChildren(`${group.groupKey}-empty`),
          };
        });
        const ungroupedPeriodChildren = buildPeriodMenuItems(
          blockReports.filter(report => !report.groupKey)
        );

        return {
          key: block.blockKey,
          label: block.blockLabel,
          children:
            ungroupedPeriodChildren.length > 0
              ? [...groupChildren, ...ungroupedPeriodChildren]
              : groupChildren,
        };
      }

      const periodChildren = buildPeriodMenuItems(blockReports);

      return {
        key: block.blockKey,
        label: block.blockLabel,
        children:
          periodChildren.length > 0
            ? periodChildren
            : placeholderChildren(`${block.blockKey}-empty`),
      };
    });
}
