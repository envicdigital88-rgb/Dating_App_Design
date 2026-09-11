import React from 'react';
import { CompassIcon, HeartHandshakeIcon, MessageCircleIcon, SendIcon, UserPlusIcon } from 'lucide-react';
import { SectionHeading } from '../ui/Bits';

const steps = [
{
  icon: <UserPlusIcon className="h-5 w-5" />,
  title: 'Create your profile',
  body: 'Photos, a short bio, what you are actually looking for. Ten minutes, no questionnaire.'
},
{
  icon: <CompassIcon className="h-5 w-5" />,
  title: 'Discover people',
  body: 'Browse full profiles with real galleries — not a stack of nameless cards.'
},
{
  icon: <SendIcon className="h-5 w-5" />,
  title: 'Send a wingle',
  body: 'A wingle with a note. Limited by your package, so you send them to people you mean.'
},
{
  icon: <HeartHandshakeIcon className="h-5 w-5" />,
  title: 'Connect',
  body: 'When they accept, you are connected and a conversation opens between you.'
},
{
  icon: <MessageCircleIcon className="h-5 w-5" />,
  title: 'Mingling',
  body: 'Chat, then date. Share photos, agree on a plan, and get off the app. That is the whole point.'
}];


export function HowItWorks() {
  return (
    <section id="how" className="border-b border-sand/60 py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <SectionHeading
          overline="How Wingle Mingle works"
          title="Five steps, in the order they actually happen"
          body="Wingle Mingle is deliberately linear. You are never guessing what the app wants from you next." />
        

        <ol className="mt-12 space-y-4 lg:mt-16 lg:flex lg:space-y-0">
          {steps.map((step, i) =>
          <li key={step.title} className="relative flex gap-4 lg:flex-1 lg:flex-col lg:gap-0 lg:px-4">
              <div className="flex flex-col items-center lg:w-full lg:flex-row">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-berry-500 text-white">
                  {step.icon}
                </span>
                {i < steps.length - 1 &&
              <span className="my-1 w-px flex-1 bg-sand lg:my-0 lg:ml-3 lg:h-px lg:w-auto lg:flex-1" />
              }
              </div>
              <div className="pb-6 lg:pb-0 lg:pt-6">
                <h3 className="font-display text-xl text-ink">{step.title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">{step.body}</p>
              </div>
            </li>
          )}
        </ol>
      </div>
    </section>);

}