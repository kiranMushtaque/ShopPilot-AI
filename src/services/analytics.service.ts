import { db } from '../db/store';

export class AnalyticsService {
  public async getDashboardMetrics() {
    return db.getAnalyticsMetrics();
  }

  public async getAuditLogs() {
    return db.getAuditLogs();
  }
}

export const analyticsService = new AnalyticsService();
