'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Label, Select, Textarea } from './ui/Field';
import { useStore } from '@/lib/contexts/StoreContext';
import type { Report } from '@/lib/types';

const reasons = [
'Inappropriate photo',
'Fake or misleading profile',
'Spam or scam',
'Harassment or abuse',
'Underage user',
'Something else'];


export function ReportDialog({
  open,
  onClose,
  userId,
  userName,
  context = 'profile'






}: {open: boolean;onClose: () => void;userId: string;userName: string;context?: Report['context'];}) {
  const { reportUser, blockUser } = useStore();
  const [reason, setReason] = useState(reasons[0]);
  const [customReason, setCustomReason] = useState('');
  const [detail, setDetail] = useState('');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Report ${userName}`}
      description="Our moderation team reviews every report. Nothing is shared with the person you are reporting."
      footer={
      <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
          variant="danger"
          onClick={() => {
            if (window.confirm("Reporting this user will also block them. Are you sure you want to proceed?")) {
              const finalReason = reason === 'Something else' ? (customReason || 'Other') : reason;
              reportUser(userId, finalReason, detail, context);
              blockUser(userId);
              setDetail('');
              setCustomReason('');
              onClose();
              toast.success('User reported and blocked');
            }
          }}>
          
            Send report
          </Button>
        </>
      }>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="report-reason">Reason</Label>
          <Select id="report-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
            {reasons.map((r) =>
            <option key={r}>{r}</option>
            )}
          </Select>
        </div>
        {reason === 'Something else' && (
          <div>
            <Label htmlFor="custom-reason">Please specify</Label>
            <input
              id="custom-reason"
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Type your reason here..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50"
            />
          </div>
        )}
        <div>
          <Label htmlFor="report-detail">What happened?</Label>
          <Textarea
            id="report-detail"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="Add anything that will help our team review this." />
          
        </div>
      </div>
    </Modal>);

}