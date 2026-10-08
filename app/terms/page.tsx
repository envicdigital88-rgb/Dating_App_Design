'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeftIcon } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';

export default function TermsPage() {
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
                Terms & Conditions
              </h1>
              <p className="text-sm font-semibold text-ink-muted uppercase tracking-[0.2em] mb-12 border-b border-white/10 pb-6 text-center sm:text-left">
                Last updated: 8 October 2026
              </p>
              
              <div className="space-y-12 text-[16px] leading-relaxed text-ink-soft/90">
                <section className="group">
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p className="mb-4">Welcome to WingleMingle.</p>
                    <p className="mb-4">These Terms & Conditions govern your access to and use of the WingleMingle website, progressive web application, features and services.</p>
                    <p className="mb-4">By creating an account or using WingleMingle, you agree to these Terms.</p>
                    <p>If you do not agree with these Terms, please do not use WingleMingle.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">1</span>
                    About WingleMingle
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">WingleMingle is an online social discovery and connection platform that allows adults to create profiles, discover other users, express interest, communicate and develop connections.</p>
                    <p>WingleMingle may provide free and paid features.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">2</span>
                    Eligibility
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">WingleMingle is for people aged 18 and over.</p>
                    <p className="mb-2">By creating an account, you confirm that:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>You are at least 18 years old.</li>
                      <li>The information you provide is reasonably accurate.</li>
                      <li>You are legally permitted to use the service.</li>
                      <li>You will comply with these Terms and our Community Guidelines.</li>
                    </ul>
                    <p>If you are under 18, you must not use WingleMingle.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">3</span>
                    Your account
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">You are responsible for maintaining the security of your account and login credentials.</p>
                    <p className="mb-2">You must not:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Share your login credentials with another person.</li>
                      <li>Allow another person to use your account.</li>
                      <li>Create accounts for another person without their permission.</li>
                      <li>Create multiple accounts to evade restrictions or bans.</li>
                      <li>Impersonate another person.</li>
                    </ul>
                    <p>You are responsible for activity carried out through your account unless you can demonstrate that the activity was not authorised by you and you acted reasonably to protect your account.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">4</span>
                    Your profile
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">You are responsible for the information and content you add to your profile.</p>
                    <p className="mb-2">You agree that your profile information will not:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Deliberately impersonate another person.</li>
                      <li>Contain fraudulent information intended to deceive others.</li>
                      <li>Contain illegal content.</li>
                      <li>Contain content that violates these Terms or our Community Guidelines.</li>
                    </ul>
                    <p>You should only upload photographs that you have the right to use.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">5</span>
                    User-generated content
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">You may upload photographs, profile information, messages and other content.</p>
                    <p className="mb-4">You retain ownership of content that you create.</p>
                    <p className="mb-4">By submitting content to WingleMingle, you grant us a limited, non-exclusive licence to host, store, reproduce, display and process that content as reasonably necessary to operate, secure and improve the service.</p>
                    <p>We do not claim ownership of your photographs or other original content merely because you upload it.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">6</span>
                    Content moderation
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">We may review, restrict or remove content that we reasonably believe violates our Terms, Community Guidelines, applicable law or the safety of the community.</p>
                    <p>We may use automated systems, human review, reports and other reasonable methods to identify potentially harmful or prohibited activity.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">7</span>
                    Wingits
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">Wingits are WingleMingle's virtual currency used to access certain features.</p>
                    <p className="mb-2">At launch:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>New users receive 20 Wingits.</li>
                      <li>Users may receive additional Wingits through promotional or other methods offered by WingleMingle.</li>
                      <li>Users may purchase additional Wingits.</li>
                      <li>100 Wingits currently correspond to LKR 100 for the applicable purchase package, subject to the package and price displayed at the time of purchase.</li>
                    </ul>
                    <p className="mb-4">WingleMingle may change Wingit packages, prices or feature costs in the future.</p>
                    <p className="mb-2">Wingits:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Have no cash value outside WingleMingle.</li>
                      <li>Cannot be exchanged for cash.</li>
                      <li>Cannot normally be transferred outside the platform.</li>
                      <li>Cannot be sold or traded between users unless WingleMingle expressly provides such functionality.</li>
                    </ul>
                    <p>Wingits are not a bank account, deposit, investment or financial instrument.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">8</span>
                    Paid features
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">Certain WingleMingle features may require Wingits.</p>
                    <p className="mb-4">The number of Wingits required for a feature will be shown before the relevant action is completed where reasonably practicable.</p>
                    <p className="mb-2">Examples may include:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Viewing certain requests</li>
                      <li>Accepting certain requests</li>
                      <li>Viewing certain photographs</li>
                      <li>Sending Secret Wingles</li>
                      <li>Other premium or enhanced features introduced by WingleMingle</li>
                    </ul>
                    <p>Feature costs may change.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">9</span>
                    Purchases and refunds
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">When you purchase Wingits, you authorise the applicable payment provider to process the transaction.</p>
                    <p className="mb-4">Before completing a purchase, review the displayed price and quantity.</p>
                    <p className="mb-4">Except where required by applicable law, purchased virtual currency and digital features may not be refundable once delivered or consumed.</p>
                    <p className="mb-4">If you believe a purchase was made in error, duplicated or unauthorised, contact us at:</p>
                    <p className="mb-4"><a href="mailto:info@winglemingle.com" className="text-berry-400 hover:text-berry-300 transition-colors">info@winglemingle.com</a></p>
                    <p>We may request transaction information necessary to investigate the issue.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">10</span>
                    Secret Wingle
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">Secret Wingle allows users to send an anonymous crush message to another person.</p>
                    <p className="mb-4">Secret Wingle must only be used respectfully.</p>
                    <p className="mb-2">You must not use Secret Wingle to:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Harass someone</li>
                      <li>Threaten someone</li>
                      <li>Stalk someone</li>
                      <li>Send abusive content</li>
                      <li>Send illegal content</li>
                      <li>Repeatedly contact someone who does not want contact</li>
                      <li>Reveal another person's private information</li>
                      <li>Impersonate another person</li>
                    </ul>
                    <p>WingleMingle may restrict or remove access to Secret Wingle where it is misused.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">11</span>
                    Communications between users
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">WingleMingle provides tools that allow users to communicate with each other.</p>
                    <p className="mb-4">You are responsible for what you send.</p>
                    <p className="mb-2">Do not send:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Threats</li>
                      <li>Fraudulent requests</li>
                      <li>Harassment</li>
                      <li>Unwanted sexual content</li>
                      <li>Malicious links</li>
                      <li>Private information belonging to another person</li>
                      <li>Illegal content</li>
                    </ul>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">12</span>
                    Safety
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">WingleMingle provides tools intended to support safer online interaction, including reporting and blocking.</p>
                    <p className="mb-4">However, we cannot guarantee that every user is who they claim to be or that every interaction will be safe.</p>
                    <p>You are responsible for making sensible decisions about who you communicate with and whether you meet someone offline.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">13</span>
                    Prohibited use
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-2">You must not use WingleMingle to:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Break the law.</li>
                      <li>Commit fraud.</li>
                      <li>Harass or threaten others.</li>
                      <li>Impersonate people.</li>
                      <li>Distribute malware.</li>
                      <li>Spam users.</li>
                      <li>Scrape or collect user information without permission.</li>
                      <li>Circumvent security measures.</li>
                      <li>Reverse engineer the service except where applicable law permits.</li>
                      <li>Create fake engagement.</li>
                      <li>Operate automated accounts without our permission.</li>
                      <li>Attempt to gain unauthorised access to accounts or systems.</li>
                    </ul>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">14</span>
                    Account suspension and termination
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">We may suspend, restrict or terminate an account if we reasonably believe that:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>These Terms have been violated.</li>
                      <li>Our Community Guidelines have been violated.</li>
                      <li>The account presents a safety or security risk.</li>
                      <li>Fraud or abuse has occurred.</li>
                      <li>The account is being used illegally.</li>
                      <li>The account has been created to evade a previous restriction.</li>
                    </ul>
                    <p>Where appropriate, we may also remove associated content or restrict access to Wingits and paid features.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">15</span>
                    Account deletion
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">You may request deletion of your account.</p>
                    <p className="mb-4">Account deletion may result in the loss of:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Your profile</li>
                      <li>Photographs</li>
                      <li>Messages</li>
                      <li>Connections</li>
                      <li>Wingles</li>
                      <li>Unused or purchased Wingits</li>
                      <li>Other account information</li>
                    </ul>
                    <p>Some information may need to be retained for legal, fraud prevention, security or legitimate business purposes.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">16</span>
                    Availability of the service
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">We aim to keep WingleMingle available, but we do not guarantee uninterrupted access.</p>
                    <p className="mb-4">The service may occasionally be unavailable because of:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Maintenance</li>
                      <li>Technical failures</li>
                      <li>Security incidents</li>
                      <li>Hosting or infrastructure issues</li>
                      <li>Third-party service interruptions</li>
                      <li>Circumstances beyond our reasonable control</li>
                    </ul>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">17</span>
                    Third-party services
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">WingleMingle may rely on third-party providers for services such as:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Hosting</li>
                      <li>Authentication</li>
                      <li>Payments</li>
                      <li>Email</li>
                      <li>Analytics</li>
                      <li>Notifications</li>
                      <li>Security</li>
                      <li>Infrastructure</li>
                    </ul>
                    <p>Those services may have their own terms and privacy policies.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">18</span>
                    No guarantee of relationships
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">WingleMingle provides a platform for people to meet and communicate.</p>
                    <p className="mb-4">We do not guarantee that:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>You will find a relationship.</li>
                      <li>You will receive a Wingle.</li>
                      <li>Another user will respond.</li>
                      <li>A connection will continue.</li>
                      <li>Information provided by another user is accurate.</li>
                      <li>An online connection will result in an offline meeting.</li>
                    </ul>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">19</span>
                    Limitation of responsibility
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">To the maximum extent permitted by applicable law, WingleMingle is not responsible for losses arising from interactions between users, including interactions that occur outside the platform.</p>
                    <p>Nothing in these Terms excludes or limits liability where doing so would be unlawful.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">20</span>
                    Changes to WingleMingle
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">We may add, remove or change features, pricing, Wingit costs or other aspects of the service.</p>
                    <p className="mb-4">We may also update these Terms from time to time.</p>
                    <p>If changes are material, we will take reasonable steps to notify users.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">21</span>
                    Applicable law
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">These Terms are governed by the laws applicable to the legal entity operating WingleMingle, subject to any mandatory consumer or other legal protections that apply to you.</p>
                    <p className="italic text-ink-soft">Before publishing this section, replace this paragraph with the exact governing-law and jurisdiction clause recommended by your lawyer.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">22</span>
                    Contact
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">If you have questions about these Terms:</p>
                    <p className="mb-8">Email: <a href="mailto:info@winglemingle.com" className="text-berry-400 hover:text-berry-300 transition-colors">info@winglemingle.com</a></p>
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
