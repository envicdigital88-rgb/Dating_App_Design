import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Auth } from '@/components/views/Auth';

export default async function Page() {
  const session = await getSession();
  if (session?.userId) {
    try {
      const user = await db.orm.public.User.where({ id: session.userId as string }).first();
      if (user && !user.suspended) {
        if (user.role === 'admin') {
          redirect('/admin');
        } else if (!user.onboarded) {
          redirect('/onboarding');
        } else {
          redirect('/discover');
        }
      }
    } catch (err: any) {
      if (err?.digest?.startsWith('NEXT_REDIRECT') || err?.message === 'NEXT_REDIRECT') {
        throw err;
      }
      console.error('Sign-up page server auth check error:', err);
    }
  }

  return <Auth mode="register" />;
}
