'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftIcon, AlertOctagonIcon, ChevronDownIcon, Loader2Icon } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';
import { submitReportAction } from '@/app/actions/safety';
import { toast } from 'sonner';

const REASONS = [
  { value: 'fake_profile', label: 'Fake profile' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'scam', label: 'Scam or fraud' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'spam', label: 'Spam' },
  { value: 'secret_wingle_abuse', label: 'Secret Wingle abuse' },
  { value: 'threatening', label: 'Threatening behaviour' },
  { value: 'privacy', label: 'Privacy violation' },
  { value: 'other', label: 'Other' },
];

export default function ReportPage() {
  const [url, setUrl] = useState('');
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      toast.error('Please enter a Profile URL or Username.');
      return;
    }
    if (!reason) {
      toast.error('Please select a reason for reporting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitReportAction(url, reason, details);
      if (res.ok) {
        toast.success('Report submitted successfully. Thank you.');
        setUrl('');
        setReason('');
        setDetails('');
      } else {
        toast.error(res.error || 'Failed to submit report. Please try again.');
      }
    } catch (err) {
      toast.error('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07061a] text-ink selection:bg-berry-500/30 relative overflow-hidden font-sans">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-[#8b2fc9] opacity-35 blur-[100px]" />
        <div className="absolute -bottom-32 right-0 h-[350px] w-[350px] rounded-full bg-[#0ea5e9] opacity-25 blur-[90px]" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ec4899] opacity-10 blur-[80px]" />
      </div>

      <div className="pointer-events-none absolute -right-16 top-1/2 -translate-y-1/2 select-none opacity-[0.06]">
        <img src="/logo.png" alt="" width={380} height={380} className="object-contain" />
      </div>

      <div className="mx-auto max-w-4xl px-5 py-12 md:py-20 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
          <div className="flex flex-col-reverse items-center sm:flex-row sm:items-center justify-between gap-6 mb-12">
            <Link href="/" className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-ink-soft transition-all duration-300 hover:bg-white/10 hover:text-ink hover:border-white/20 sm:self-auto">
              <ArrowLeftIcon className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
              Back to Home
            </Link>
            <BrandMark size={56} className="opacity-90 transition-opacity hover:opacity-100" />
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-3xl p-8 md:p-14 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 pointer-events-none" />
            <div className="relative z-10">
              <h1 className="font-display text-4xl md:text-5xl font-bold bg-gradient-to-br from-berry-300 via-plum-300 to-indigo-300 bg-clip-text text-transparent mb-12 tracking-tight text-center sm:text-left">
                Report a Profile or User
              </h1>
              
              <div className="grid sm:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <section className="group">
                    <h2 className="text-2xl font-display font-semibold text-ink mb-4 transition-colors group-hover:text-berry-300">
                      Help us keep WingleMingle safe
                    </h2>
                    <div className="border-l-2 border-white/5 pl-6 py-1">
                      <p className="text-ink-soft text-[15px] mb-4">
                        If you believe a profile, message, photograph, Wingle or Secret Wingle violates our Community Guidelines or makes you feel unsafe, please report it.
                      </p>
                      <p className="text-ink-soft text-[15px]">
                        Reports help us identify harmful behaviour and protect the community.
                      </p>
                    </div>
                  </section>

                  <section className="group">
                    <h2 className="text-2xl font-display font-semibold text-ink mb-4 transition-colors group-hover:text-berry-300">
                      What can you report?
                    </h2>
                    <div className="border-l-2 border-white/5 pl-6 py-1">
                      <p className="text-ink-soft text-[15px] mb-2">You can report:</p>
                      <ul className="list-disc pl-5 space-y-1 text-ink-soft/80 text-[15px]">
                        <li>A fake or misleading profile</li>
                        <li>Harassment or bullying</li>
                        <li>Threatening behaviour</li>
                        <li>Inappropriate photographs</li>
                        <li>Sexual or explicit content</li>
                        <li>Scams or financial fraud</li>
                        <li>Spam</li>
                        <li>Impersonation</li>
                        <li>Misuse of Secret Wingle</li>
                        <li>Sharing private information</li>
                        <li>Suspicious or illegal activity</li>
                        <li>Any other behaviour that concerns you</li>
                      </ul>
                    </div>
                  </section>

                  <section className="group">
                    <h2 className="text-2xl font-display font-semibold text-ink mb-4 transition-colors group-hover:text-berry-300">
                      What happens after you report?
                    </h2>
                    <div className="border-l-2 border-white/5 pl-6 py-1">
                      <p className="text-ink-soft text-[15px] mb-4">
                        We review reports and may take action where appropriate.
                      </p>
                      <p className="text-ink-soft text-[15px] mb-4">
                        Depending on the situation, action may include removing content, restricting features, suspending an account or permanently removing an account from WingleMingle.
                      </p>
                      <p className="text-ink-soft text-[15px] mb-4">
                        We may contact you if we need additional information.
                      </p>
                      <p className="text-ink-soft text-[15px]">
                        For privacy and safety reasons, we may not be able to tell you exactly what action was taken against another user.
                      </p>
                    </div>
                  </section>

                  <section className="group">
                    <h2 className="text-2xl font-display font-semibold text-ink mb-4 transition-colors group-hover:text-berry-300">
                      Emergency situations
                    </h2>
                    <div className="border-l-2 border-white/5 pl-6 py-1">
                      <p className="text-ink-soft text-[15px] mb-4 font-semibold text-berry-300">
                        WingleMingle is not an emergency service.
                      </p>
                      <p className="text-ink-soft text-[15px]">
                        If you believe you are in immediate danger, contact your local emergency services or law enforcement authority.
                      </p>
                    </div>
                  </section>
                  
                  <p className="text-ink font-medium mt-8 italic text-[15px]">Thank you for helping us keep WingleMingle safer.</p>
                </div>
                
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 h-fit sticky top-10">
                  <h3 className="font-display font-semibold text-xl text-ink mb-2">Your report</h3>
                  <p className="text-ink-soft text-[14px] mb-6">Please provide as much useful information as possible.</p>
                  <form className="space-y-5" onSubmit={handleSubmit}>
                    <div>
                      <label htmlFor="url" className="sr-only">Profile URL or Username</label>
                      <input 
                        type="text" 
                        id="url" 
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Profile URL or Username" 
                        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-berry-500/50 focus:outline-none focus:ring-1 focus:ring-berry-500/50" 
                      />
                    </div>
                    
                    {/* Custom Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm focus:border-berry-500/50 focus:outline-none focus:ring-1 focus:ring-berry-500/50 flex justify-between items-center transition-colors hover:bg-black/40"
                      >
                        <span className={reason ? "text-ink" : "text-ink-muted"}>
                          {reason ? REASONS.find(r => r.value === reason)?.label : 'Select a reason'}
                        </span>
                        <ChevronDownIcon className={`h-4 w-4 text-ink-muted transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15 }}
                            className="absolute z-20 mt-2 w-full rounded-xl border border-white/10 bg-[#16132b] shadow-xl overflow-hidden backdrop-blur-xl"
                          >
                            <div className="py-1">
                              {REASONS.map((r) => (
                                <button
                                  key={r.value}
                                  type="button"
                                  onClick={() => {
                                    setReason(r.value);
                                    setIsDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-white/10 ${
                                    reason === r.value ? 'bg-berry-500/20 text-berry-300' : 'text-ink-soft'
                                  }`}
                                >
                                  {r.label}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div>
                      <label htmlFor="details" className="sr-only">Tell us what happened</label>
                      <textarea 
                        id="details" 
                        rows={5} 
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        placeholder="Tell us what happened..." 
                        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-berry-500/50 focus:outline-none focus:ring-1 focus:ring-berry-500/50 resize-none"
                      ></textarea>
                      <p className="text-ink-muted text-[13px] mt-3 leading-relaxed">
                        Please do not include passwords, payment card details or other sensitive information that is not necessary for us to investigate the report.
                      </p>
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full rounded-xl bg-red-500/80 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-[#141414] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2Icon className="h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Report'
                      )}
                    </button>
                  </form>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
