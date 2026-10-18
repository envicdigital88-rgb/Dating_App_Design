import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Auth } from '@/components/views/Auth';

export default async function Page(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = props.searchParams ? await props.searchParams : {};
  const from = typeof params.from === 'string' ? params.from : undefined;

  const session = await getSession();
  if (session?.userId) {
    try {
      const user = await db.orm.public.User.where({ id: session.userId as string }).first();
      if (user && !user.suspended) {
        if (from && from.startsWith('/') && !from.startsWith('/sign-')) {
          redirect(from);
        } else if (user.role === 'admin') {
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
      console.error('Sign-in page server auth check error:', err);
    }
  }

  return <Auth mode="signin" />;
}
