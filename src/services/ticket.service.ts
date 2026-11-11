import { db } from '../db/store';
import { SupportTicket } from '../types';

export class TicketService {
  public async createTicket(data: {
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    subject: string;
    reason: string;
    conversationId?: string;
    userId?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    transcriptSnippet?: string;
  }): Promise<SupportTicket> {
    return db.createSupportTicket(data);
  }

  public async getAllTickets(): Promise<SupportTicket[]> {
    return db.getAllTickets();
  }

  public async resolveTicket(ticketId: string): Promise<SupportTicket> {
    return db.updateTicketStatus(ticketId, 'RESOLVED');
  }

  public async updateStatus(ticketId: string, status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'): Promise<SupportTicket> {
    return db.updateTicketStatus(ticketId, status);
  }
}

export const ticketService = new TicketService();
