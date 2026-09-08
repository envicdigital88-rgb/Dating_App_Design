import React from 'react';
import { AdminHeader, StatTile } from './AdminShell';
import { Badge } from '../../components/ui/Bits';
import { useStore } from '../../contexts/StoreContext';
import { relativeTime } from '../../utils/format';

export function AdminActivity() {
  const { db, freePackage } = useStore();

  const requests = db.requests;
  const accepted = requests.filter((r) => r.status === 'accepted');
  const declined = requests.filter((r) => r.status === 'declined');
  const acceptRate = requests.length ?
  Math.round(accepted.length / (accepted.length + declined.length || 1) * 100) :
  0;

  const usageRows = db.users.
  filter((u) => u.role === 'member').
  map((user) => {
    const usage = db.usage.find((x) => x.userId === user.id);
    const sub = db.subscriptions.find(
      (s) => s.userId === user.id && s.status === 'active' && new Date(s.expiresAt) > new Date()
    );
    const pkg = sub ? db.packages.find((p) => p.id === sub.packageId) ?? freePackage : freePackage;
    const sent = db.messages.filter((m) => m.senderId === user.id).length;
    return {
      user,
      pkg,
      chatUsed: usage?.chatUsed ?? 0,
      requestsUsed: usage?.requestsUsed ?? 0,
      sent
    };
  }).
  sort((a, b) => b.chatUsed - a.chatUsed);

  return (
    <div>
      <AdminHeader
        title="Requests & chat"
        body="Request throughput, chat consumption per member, and abuse signals. Usage is metered server-side against each member's package." />
      

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Total requests" value={requests.length} />
        <StatTile label="Accepted" value={accepted.length} hint={`${acceptRate}% accept rate`} />
        <StatTile label="Messages sent" value={db.messages.length} emphasis />
        <StatTile
          label="Blocks"
          value={db.blocks.length}
          hint={`${db.reports.filter((r) => r.context === 'chat').length} chat reports`} />
        
      </div>

      <section className="mt-8 overflow-hidden rounded-4xl bg-white shadow-card">
        <h2 className="border-b border-sand px-5 py-4 font-display text-xl text-ink">
          Chat usage by member
        </h2>
        <table className="w-full text-left text-[14px]">
          <thead className="border-b border-sand text-[12px] uppercase tracking-[0.06em] text-ink-muted">
            <tr>
              <th scope="col" className="px-5 py-3 font-semibold">Member</th>
              <th scope="col" className="px-5 py-3 font-semibold">Package</th>
              <th scope="col" className="px-5 py-3 font-semibold">Messages used</th>
              <th scope="col" className="hidden px-5 py-3 font-semibold md:table-cell">Requests used</th>
              <th scope="col" className="px-5 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand">
            {usageRows.map((row) => {
              const exhausted =
              row.pkg.chatLimit !== null && row.chatUsed >= row.pkg.chatLimit;
              return (
                <tr key={row.user.id}>
                  <td className="px-5 py-3.5">
                    <span className="block font-medium text-ink">{row.user.name}</span>
                    <span className="block text-[12px] text-ink-muted">
                      Active {relativeTime(row.user.lastActiveAt)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-ink-soft">{row.pkg.name}</td>
                  <td className="px-5 py-3.5 text-ink-soft">
                    {row.chatUsed} / {row.pkg.chatLimit === null ? '∞' : row.pkg.chatLimit}
                  </td>
                  <td className="hidden px-5 py-3.5 text-ink-soft md:table-cell">
                    {row.requestsUsed} / {row.pkg.requestLimit === null ? '∞' : row.pkg.requestLimit}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge tone={exhausted ? 'red' : 'moss'}>
                      {exhausted ? 'Limit reached' : 'Within limit'}
                    </Badge>
                  </td>
                </tr>);

            })}
          </tbody>
        </table>
      </section>

      <section className="mt-5 overflow-hidden rounded-4xl bg-white shadow-card">
        <h2 className="border-b border-sand px-5 py-4 font-display text-xl text-ink">
          Recent requests
        </h2>
        <ul className="divide-y divide-sand">
          {[...requests].
          sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).
          slice(0, 10).
          map((request) => {
            const from = db.users.find((u) => u.id === request.fromUserId);
            const to = db.users.find((u) => u.id === request.toUserId);
            return (
              <li key={request.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] text-ink">
                      {from?.name ?? 'Member'} → {to?.name ?? 'Member'}
                    </p>
                    <p className="truncate text-[12px] text-ink-muted">
                      {request.note || 'No note'} · {relativeTime(request.createdAt)}
                    </p>
                  </div>
                  <Badge
                  tone={
                  request.status === 'accepted' ?
                  'moss' :
                  request.status === 'declined' ?
                  'red' :
                  'amber'
                  }>
                  
                    {request.status}
                  </Badge>
                </li>);

          })}
        </ul>
      </section>
    </div>);

}