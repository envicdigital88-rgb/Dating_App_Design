'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Label, Select, Textarea } from './ui/Field';
import { useStore } from '../contexts/StoreContext';
import type { Report } from '../types';

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
  const { reportUser } = useStore();
  const [reason, setReason] = useState(reasons[0]);
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
            reportUser(userId, reason, detail, context);
            setDetail('');
            onClose();
            toast.success('Report sent to moderation');
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