import { dashboardModel } from '@models/dashboard/dashboard.model';

export class DashboardService {
  async getGroupActivity(
    groupId: string,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
    status?: string,
    studentId?: string
  ) {
    if (!groupId) {
      throw new Error('Group ID is required');
    }

    if (page < 1 || limit < 1) {
      throw new Error('Invalid pagination parameters');
    }

    if (sortOrder !== 'ASC' && sortOrder !== 'DESC') {
      throw new Error('Sort order must be ASC or DESC');
    }

    return await dashboardModel.getGroupActivity(
      groupId,
      page,
      limit,
      sortBy,
      sortOrder,
      status,
      studentId
    );
  }
}

export const dashboardService = new DashboardService();
