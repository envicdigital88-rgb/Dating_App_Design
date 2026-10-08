'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeftIcon } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';

export default function PrivacyPage() {
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
                Privacy Policy
              </h1>
              <p className="text-sm font-semibold text-ink-muted uppercase tracking-[0.2em] mb-12 border-b border-white/10 pb-6 text-center sm:text-left">
                Last updated: 8 October 2026
              </p>
              
              <div className="space-y-12 text-[16px] leading-relaxed text-ink-soft/90">
                <section className="group">
                  <div className="border-l-2 border-white/5 pl-6 py-1">
                    <p className="mb-4">At WingleMingle, we believe that meeting people should not mean giving up control over your personal information.</p>
                    <p>This Privacy Policy explains what information WingleMingle may collect, how we use it, when we share it and the choices available to you.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">1</span>
                    Who we are
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">WingleMingle is an online social discovery and connection service.</p>
                    <p className="mb-4">Contact email:<br /><a href="mailto:info@winglemingle.com" className="text-berry-400 hover:text-berry-300 transition-colors">info@winglemingle.com</a></p>
                    <p className="italic text-ink-soft">If you operate WingleMingle through ENVIC Global or another legal entity, use the actual legal entity name here, rather than simply "WingleMingle."</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">2</span>
                    Information we collect
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-2">Depending on how you use WingleMingle, we may collect:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Account information</li>
                      <li>Name</li>
                      <li>Email address</li>
                      <li>Mobile phone number</li>
                      <li>Date of birth or age</li>
                      <li>Login information</li>
                      <li>Account identifiers</li>
                      <li>Profile information</li>
                      <li>Profile photographs</li>
                      <li>Profile description</li>
                      <li>Location or general area</li>
                      <li>Interests</li>
                      <li>Preferences</li>
                      <li>Information you choose to include in your profile</li>
                      <li>WingleMingle activity</li>
                    </ul>
                    
                    <p className="mb-2">We may collect information about:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Profiles you view</li>
                      <li>Wingles you send or receive</li>
                      <li>Connections</li>
                      <li>Messages</li>
                      <li>Secret Wingles</li>
                      <li>Photos you send or receive</li>
                      <li>Features you use</li>
                      <li>Wingits received, purchased or spent</li>
                      <li>Referrals</li>
                      <li>Reports</li>
                      <li>Blocks</li>
                      <li>Account settings</li>
                      <li>Device and technical information</li>
                    </ul>

                    <p className="mb-2">We may collect information such as:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>IP address</li>
                      <li>Browser type</li>
                      <li>Device type</li>
                      <li>Operating system</li>
                      <li>Approximate location derived from technical information where necessary</li>
                      <li>Login dates and times</li>
                      <li>Diagnostic information</li>
                      <li>Security information</li>
                      <li>Information about how the service is used</li>
                      <li>Payment information</li>
                    </ul>

                    <p className="mb-4">Payments may be processed by third-party payment providers.</p>

                    <p className="mb-2">We may receive information such as:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Transaction reference</li>
                      <li>Payment status</li>
                      <li>Amount paid</li>
                      <li>Currency</li>
                      <li>Purchase information</li>
                    </ul>
                    <p>We generally do not need to store your complete payment card number ourselves.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">3</span>
                    Information you choose to share
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">Anything you deliberately place on your public or discoverable profile may be visible to other WingleMingle users according to your privacy settings and the functionality of the service.</p>
                    <p>Think carefully before publishing information on your profile.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">4</span>
                    How we use your information
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-2">We may use personal information to:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Create and manage your account.</li>
                      <li>Provide WingleMingle's features.</li>
                      <li>Display your profile to other users.</li>
                      <li>Help you discover other users.</li>
                      <li>Facilitate Wingles and connections.</li>
                      <li>Provide messaging.</li>
                      <li>Deliver Secret Wingles.</li>
                      <li>Process Wingit purchases.</li>
                      <li>Maintain account balances.</li>
                      <li>Provide customer support.</li>
                      <li>Respond to reports.</li>
                      <li>Investigate abuse.</li>
                      <li>Prevent fraud.</li>
                      <li>Protect the security of WingleMingle.</li>
                      <li>Improve our service.</li>
                      <li>Diagnose technical problems.</li>
                      <li>Understand how users interact with the service.</li>
                      <li>Send essential service communications.</li>
                      <li>Comply with legal obligations.</li>
                      <li>Protect the rights, safety and property of WingleMingle and its users.</li>
                    </ul>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">5</span>
                    Legal bases
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">Where data protection law requires a lawful basis, we may rely on different lawful bases depending on the activity.</p>
                    <p className="mb-2">These may include:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li><strong>Performance of a contract</strong> — where processing is necessary to provide your WingleMingle account and requested services.</li>
                      <li><strong>Legitimate interests</strong> — for purposes such as platform security, fraud prevention, service administration, technical maintenance and improving the service, where those interests are not overridden by your rights.</li>
                      <li><strong>Consent</strong> — where consent is required, such as certain non-essential cookies or optional marketing communications.</li>
                      <li><strong>Legal obligation</strong> — where we need to process information to comply with applicable law.</li>
                    </ul>
                    <p className="mb-4">The appropriate legal basis depends on the particular processing activity.</p>
                    <p className="italic text-ink-soft">Privacy notices should identify the purpose and lawful basis for processing where applicable.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">6</span>
                    Information visible to other users
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">WingleMingle is a social discovery service.</p>
                    <p className="mb-2">Depending on your settings and the feature being used, other users may see information such as:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>First name</li>
                      <li>Age</li>
                      <li>General area</li>
                      <li>Profile photographs</li>
                      <li>Profile description</li>
                      <li>Interests</li>
                      <li>Other information you choose to make available</li>
                    </ul>
                    <p>Your private account information, such as passwords, should never be displayed to other users.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">7</span>
                    Messages and Wingles
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">Messages, Wingles and other communications are processed to provide the service, maintain functionality, investigate reports and protect the community.</p>
                    <p className="mb-4">Where appropriate and permitted by law, we may review information associated with reports, abuse investigations, security incidents or legal requests.</p>
                    <p>Do not assume that anything you send through WingleMingle is completely inaccessible to the platform.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">8</span>
                    Secret Wingle
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">Secret Wingle allows one user to send an anonymous crush message to another person.</p>
                    <p className="mb-4">We process information necessary to deliver and manage the Secret Wingle feature.</p>
                    <p className="mb-4">The recipient may initially see the message without seeing the sender's identity, depending on the feature design.</p>
                    <p className="mb-4">Anonymous does not mean that the information is technically invisible to WingleMingle.</p>
                    <p>We may use account, technical and transaction information to investigate abuse, fraud, threats or violations of our Terms.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">9</span>
                    Safety, moderation and reports
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-2">If you report another user, we may collect and process:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Your report</li>
                      <li>The reported account</li>
                      <li>Relevant content</li>
                      <li>Supporting information you provide</li>
                      <li>Information necessary to investigate the issue</li>
                    </ul>
                    <p>We may retain relevant information where reasonably necessary for safety, fraud prevention, dispute resolution or legal obligations.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">10</span>
                    Who we share information with
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">We may share personal information with service providers that help us operate WingleMingle.</p>
                    <p className="mb-2">These may include providers of:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Cloud hosting</li>
                      <li>Database infrastructure</li>
                      <li>Payment processing</li>
                      <li>Authentication</li>
                      <li>Email</li>
                      <li>Push notifications</li>
                      <li>Analytics</li>
                      <li>Security</li>
                      <li>Customer support</li>
                      <li>Technical services</li>
                    </ul>
                    <p className="mb-2">We may also disclose information:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Where required by law.</li>
                      <li>In response to valid legal requests.</li>
                      <li>To prevent fraud or serious harm.</li>
                      <li>To protect users or the public.</li>
                      <li>To protect WingleMingle's legal rights.</li>
                      <li>As part of a merger, acquisition, restructuring or sale of relevant business assets.</li>
                    </ul>
                    <p>We do not sell your personal information simply because you create a WingleMingle account.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">11</span>
                    International processing
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">WingleMingle and its service providers may process information in countries other than the country where you live.</p>
                    <p className="mb-4">If personal information is transferred internationally, we will take reasonable steps required by applicable data protection law to protect that information.</p>
                    <p>For UK users, international transfers may require appropriate safeguards depending on the countries and organisations involved.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">12</span>
                    How long we keep information
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">We keep personal information only for as long as reasonably necessary for the purposes described in this Policy.</p>
                    <p className="mb-2">Retention periods may depend on:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Whether your account remains active.</li>
                      <li>The type of information.</li>
                      <li>Why the information was collected.</li>
                      <li>Security and fraud requirements.</li>
                      <li>Legal obligations.</li>
                      <li>Dispute resolution.</li>
                      <li>Legitimate business requirements.</li>
                    </ul>
                    <p>When information is no longer required, we may delete, anonymise or securely dispose of it.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">13</span>
                    Account deletion
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">You may request deletion of your account.</p>
                    <p className="mb-4">When an account is deleted, we will take reasonable steps to delete or anonymise information that no longer needs to be retained.</p>
                    <p className="mb-2">Some information may remain where retention is necessary for:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Legal obligations</li>
                      <li>Fraud prevention</li>
                      <li>Security</li>
                      <li>Dispute resolution</li>
                      <li>Enforcement of our Terms</li>
                      <li>Protection of users</li>
                      <li>Other lawful purposes</li>
                    </ul>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">14</span>
                    Your privacy rights
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-2">Depending on where you live and the applicable law, you may have rights including:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Access to personal information.</li>
                      <li>Correction of inaccurate information.</li>
                      <li>Deletion of personal information.</li>
                      <li>Restriction of processing.</li>
                      <li>Objection to certain processing.</li>
                      <li>Data portability.</li>
                      <li>Withdrawal of consent where processing is based on consent.</li>
                      <li>The right to complain to an applicable data protection authority.</li>
                    </ul>
                    <p className="mb-4">The exact rights available to you depend on applicable law and the circumstances of the processing.</p>
                    <p className="italic text-ink-soft mb-4">UK privacy guidance specifically expects notices to explain applicable individual rights.</p>
                    <p className="mb-4">To exercise a privacy right, contact:</p>
                    <p className="mb-4"><a href="mailto:privacy@winglemingle.com" className="text-berry-400 hover:text-berry-300 transition-colors">privacy@winglemingle.com</a></p>
                    <p>We may need to verify your identity before fulfilling certain requests.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">15</span>
                    Marketing communications
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">We may send essential communications about your account and the service.</p>
                    <p className="mb-4">Where required, we will obtain appropriate consent before sending optional marketing communications.</p>
                    <p>You can unsubscribe from marketing communications where an unsubscribe option is provided.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">16</span>
                    Security
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">We use reasonable technical and organisational measures intended to protect personal information against unauthorised access, loss, misuse or alteration.</p>
                    <p className="mb-4">However, no internet-based service can guarantee absolute security.</p>
                    <p>You are also responsible for protecting your password and account credentials.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">17</span>
                    Cookies and similar technologies
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-2">WingleMingle may use cookies, local storage and similar technologies to:</p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-ink-soft/80">
                      <li>Keep you signed in.</li>
                      <li>Maintain security.</li>
                      <li>Remember preferences.</li>
                      <li>Support essential functionality.</li>
                      <li>Understand service usage.</li>
                      <li>Improve the platform.</li>
                    </ul>
                    <p>For more information, see our Cookie Policy.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">18</span>
                    Children
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">WingleMingle is an 18+ service.</p>
                    <p className="mb-4">We do not intentionally offer accounts to people under 18.</p>
                    <p>If we become aware that a person under 18 has created an account, we may take steps to remove the account and associated information as appropriate.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">19</span>
                    Changes to this Privacy Policy
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">We may update this Privacy Policy from time to time.</p>
                    <p className="mb-4">When we make material changes, we will take reasonable steps to notify users.</p>
                    <p>The updated version will be published on this page with a revised "Last updated" date.</p>
                  </div>
                </section>

                <section className="group">
                  <h2 className="text-2xl font-display font-semibold text-ink mb-4 flex items-center gap-4 transition-colors group-hover:text-berry-300">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-berry-500/10 text-berry-400 text-sm font-bold border border-berry-500/20 shadow-inner">20</span>
                    Contact
                  </h2>
                  <div className="ml-[1.125rem] border-l-2 border-white/5 pl-8 py-1">
                    <p className="mb-4">For privacy questions or requests:</p>
                    <p className="mb-8">Email: <a href="mailto:privacy@winglemingle.com" className="text-berry-400 hover:text-berry-300 transition-colors">privacy@winglemingle.com</a></p>
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
