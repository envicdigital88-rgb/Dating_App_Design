'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeftIcon } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[#07061a] text-ink selection:bg-berry-500/30 relative overflow-hidden font-sans">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-[#8b2fc9] opacity-35 blur-[100px]" />
        <div className="absolute -bottom-32 right-0 h-[350px] w-[350px] rounded-full bg-[#0ea5e9] opacity-25 blur-[90px]" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ec4899] opacity-10 blur-[80px]" />
      </div>

      <div className="pointer-events-none absolute -right-16 top-1/2 -translate-y-1/2 select-none opacity-[0.06]">
        <img src="/logo.png" alt="" width={380} height={380} className="object-contain" />
      </div>

      <div className="mx-auto max-w-4xl px-5 py-12 md:py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex flex-col-reverse items-center sm:flex-row sm:items-center justify-between gap-6 mb-12">
            <Link 
              href="/" 
              className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-ink-soft transition-all duration-300 hover:bg-white/10 hover:text-ink hover:border-white/20 sm:self-auto"
            >
              <ArrowLeftIcon className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
              Back to Home
            </Link>
            <BrandMark size={56} className="opacity-90 transition-opacity hover:opacity-100" />
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-3xl p-8 md:p-14 shadow-2xl relative overflow-hidden">
            {/* Subtle inner glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 pointer-events-none" />
            
            <div className="relative z-10">
              <h1 className="font-display text-4xl md:text-5xl font-bold bg-gradient-to-br from-berry-300 via-plum-300 to-indigo-300 bg-clip-text text-transparent mb-6 tracking-tight text-center sm:text-left">
                Cookie Policy
              </h1>
              <p className="text-sm font-semibold text-ink-muted uppercase tracking-[0.2em] mb-12 border-b border-white/10 pb-6 text-center sm:text-left">
                Last updated: 8 October 2026
              </p>
              
              <div className="space-y-12 text-[16px] leading-relaxed text-ink-soft/90">
                
                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    What are cookies?
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p className="mb-4">Cookies are small files or similar technologies that allow a website or web application to remember information about your device or activity.</p>
                    <p>WingleMingle may also use technologies such as local storage, pixels, scripts and similar technologies where necessary for the operation of the service.</p>
                  </div>
                </section>
                
                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    Why does WingleMingle use cookies?
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p>We may use cookies and similar technologies for several purposes.</p>
                  </div>
                </section>
                
                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">1</span>
                    Strictly necessary technologies
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">These technologies are required for WingleMingle to function properly.</p>
                    <p className="mb-2">They may be used to:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Keep you signed in.</li>
                      <li>Maintain your session.</li>
                      <li>Protect your account.</li>
                      <li>Detect suspicious activity.</li>
                      <li>Maintain security.</li>
                      <li>Remember essential service settings.</li>
                      <li>Support authentication.</li>
                      <li>Maintain core application functionality.</li>
                    </ul>
                    <p>Because these technologies may be necessary to provide a service you have requested, they may be used without consent where applicable law permits.</p>
                  </div>
                </section>
                
                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">2</span>
                    Functional technologies
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">Functional technologies may remember choices you make so that WingleMingle can provide a more convenient experience.</p>
                    <p className="mb-2">Examples may include:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Language preferences</li>
                      <li>Display preferences</li>
                      <li>User interface settings</li>
                      <li>Certain application preferences</li>
                    </ul>
                    <p>Where consent is legally required, we will ask for it.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">3</span>
                    Analytics technologies
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">We may use analytics technologies to understand how people use WingleMingle.</p>
                    <p className="mb-2">For example, analytics may help us understand:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Which pages are visited.</li>
                      <li>Which features are used.</li>
                      <li>How users navigate the service.</li>
                      <li>Whether pages are working correctly.</li>
                      <li>Where technical problems occur.</li>
                    </ul>
                    <p>Analytics technologies that are not strictly necessary may require your consent depending on the technology and applicable law.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">4</span>
                    Marketing technologies
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p>If WingleMingle introduces advertising or marketing technologies that store or access information on your device, we will provide appropriate information and obtain consent where required.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    Third-party technologies
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p className="mb-4">Some technologies may be provided by third parties.</p>
                    <p className="mb-2">For example, WingleMingle may use third-party providers for:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Analytics</li>
                      <li>Payments</li>
                      <li>Security</li>
                      <li>Authentication</li>
                      <li>Hosting</li>
                      <li>Embedded services</li>
                    </ul>
                    <p>Third-party providers may process information according to their own privacy policies and contractual arrangements with WingleMingle.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    Your choices
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p className="mb-4">Where consent is required, you can choose whether to accept optional cookies or similar technologies.</p>
                    <p className="mb-2">You should be able to:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Accept optional cookies.</li>
                      <li>Reject optional cookies.</li>
                      <li>Change your preferences later.</li>
                    </ul>
                    <p className="mb-4">Essential technologies may continue to operate where necessary for WingleMingle to function.</p>
                    <p className="italic text-ink-soft">For UK users, applicable rules generally require clear information about storage/access technologies and prior consent for non-exempt technologies.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    Browser controls
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p className="mb-4">You can also control cookies through your browser settings.</p>
                    <p>Blocking certain cookies may affect how WingleMingle works.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    Cookie duration
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p className="mb-4">Some cookies may exist only while your browser session is active.</p>
                    <p className="mb-4">Others may remain for a longer period depending on their purpose.</p>
                    <p>We aim to use reasonable retention periods and review the technologies used on the service.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    Keeping this policy updated
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p className="mb-4">The exact cookies and technologies used by WingleMingle may change as the platform develops.</p>
                    <p>We will update this Cookie Policy when our use of cookies or similar technologies materially changes.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    Contact
                  </h2>
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p className="mb-4">If you have questions about cookies or privacy:</p>
                    <p className="mb-8"><a href="mailto:privacy@winglemingle.com" className="text-berry-400 hover:text-berry-300 transition-colors">privacy@winglemingle.com</a></p>
                    <div className="text-center sm:text-left mt-8 pt-8 border-t border-white/10">
                      <p className="font-display font-bold text-xl text-ink">WingleMingle</p>
                      <p className="text-berry-300 mt-2 font-medium">Catch a Wingle. Make a Mingle.</p>
                    </div>
                  </div>
                </section>

              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
