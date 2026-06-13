import { loadDashboardTasks, type DashboardTask } from './dashboardData';

export type ExecutiveTaskRow = {
  id: string;
  title: string;
  department: string;
  priority: number;
};

function mapExecutiveTask(task: DashboardTask): ExecutiveTaskRow {
  return {
    id: task.id,
    title: task.name,
    department: task.department,
    priority: task.impact,
  };
}

export async function loadOverdueExecutiveTasks(): Promise<ExecutiveTaskRow[]> {
  const tasks = await loadDashboardTasks();
  return tasks
    .filter(task => task.status === 'Quá hạn' || task.status === 'Trễ hạn')
    .map(mapExecutiveTask);
}

export async function loadImportantExecutiveTasks(): Promise<ExecutiveTaskRow[]> {
  const tasks = await loadDashboardTasks();
  return tasks
    .filter(task => task.impact >= 3 && task.status !== 'Hoàn thành')
    .map(mapExecutiveTask);
}
