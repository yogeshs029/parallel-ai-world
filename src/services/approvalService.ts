import { ApprovalRequest } from '../types/runtime';

const API_BASE = 'http://127.0.0.1:8000/api';

export const approvalService = {
  async getApprovals(worldId: string, status?: string): Promise<ApprovalRequest[]> {
    try {
      let url = `${API_BASE}/worlds/${worldId}/approvals`;
      if (status) url += `?status=${status}`;
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend approvals API offline:', e);
    }
    return [];
  },

  async approveRequest(worldId: string, approvalId: string, comment?: string): Promise<ApprovalRequest | null> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/approvals/${approvalId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend approvals API offline:', e);
    }
    return null;
  },

  async denyRequest(worldId: string, approvalId: string, comment?: string): Promise<ApprovalRequest | null> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/approvals/${approvalId}/deny`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend approvals API offline:', e);
    }
    return null;
  },
};
