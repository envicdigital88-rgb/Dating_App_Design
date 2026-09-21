'use client';

import React, { useState } from 'react';
import { SendIcon } from 'lucide-react';
import { Page, PageHeader } from '@/components/AppShell';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { useStore } from '@/lib/contexts/StoreContext';

export function SecretWingleTab() {
  const { sendSecretWingle, secretWinglesReceived } = useStore();
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!phone.trim()) {
      toast.error('Please enter a phone number');
      return;
    }
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setLoading(true);
    try {
      const res = await sendSecretWingle(phone, message);
      if (res.ok) {
        toast.success('Secret Wingle sent!');
        setPhone('');
        setMessage('');
      } else {
        toast.error(res.error || 'Failed to send Secret Wingle');
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <PageHeader
        title="Secret Wingles"
      />
      <div className="flex-1 overflow-y-auto p-4 flex justify-center">
        <div className="w-full max-w-md flex flex-col space-y-8 mt-4">
          
          {/* Received Secret Wingles Section */}
          {secretWinglesReceived().length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Someone likes you! 🤫</h3>
              <div className="space-y-3">
                {secretWinglesReceived().map((sw) => (
                  <div key={sw.id} className="bg-white dark:bg-[--surface-dark] border border-[--primary]/30 rounded-2xl p-5 shadow-md shadow-[--primary]/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-[--primary]/10 rounded-bl-full -z-10" />
                    <p className="text-gray-900 dark:text-white font-medium text-lg mb-2">"{sw.message}"</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Sent by: <span className="font-semibold text-[--primary]">{sw.sender?.name || 'A secret admirer'}</span> 
                      {sw.sender && ` (${sw.sender.age}, ${sw.sender.location})`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Send Form Section */}
          <div className="text-center space-y-2 mt-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Have a secret crush?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Send them an anonymous message. If they sign up for WingleMingle with their phone number, they'll see it!
            </p>
          </div>

          <div className="bg-white dark:bg-[--surface-dark] border border-gray-200 dark:border-[--border-dark] rounded-2xl p-6 shadow-sm flex flex-col space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Their Phone Number</label>
              <input
                type="tel"
                placeholder="+1 234 567 8900"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[--border-dark] bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[--primary] focus:border-transparent transition-all outline-none"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Message</label>
              <textarea
                placeholder="Hey, I've had a crush on you for a while..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[--border-dark] bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[--primary] focus:border-transparent transition-all outline-none resize-none"
              />
            </div>

            <Button
              className="w-full py-4 text-lg font-semibold flex items-center justify-center gap-2"
              onClick={handleSend}
              loading={loading}
              disabled={loading || !phone.trim() || !message.trim()}
            >
              <SendIcon className="w-5 h-5" />
              Send Secretly
            </Button>
          </div>
          
        </div>
      </div>
    </Page>
  );
}
