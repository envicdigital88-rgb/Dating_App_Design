import { getSession, deleteSession } from '@/lib/session';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { LandingView } from '@/components/landing/LandingView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Landing(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = props.searchParams ? await props.searchParams : {};
  
  if (params.preview !== 'true') {
    const session = await getSession();
    if (session?.userId) {
      try {
        const user = await db.orm.public.User.where({ id: session.userId as string }).first();
        if (user) {
          if (user.suspended) {
            await deleteSession();
            redirect('/sign-in?suspended=' + encodeURIComponent(user.suspensionReason || 'Violation of community safety guidelines.'));
          }
          if (!user.verified) {
            redirect('/verify-email');
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
        console.error('Landing page server auth check error:', err);
      }
    }
  }

  return <LandingView />;
}
