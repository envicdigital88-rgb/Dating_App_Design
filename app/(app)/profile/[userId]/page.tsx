import { ProfileDetail } from '@/components/views/ProfileDetail';
import { getUserProfile } from '@/app/actions/user';
import { redirect } from 'next/navigation';

export default async function Page({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const profile = await getUserProfile(userId);
  if (profile.status === 'self') redirect('/profile');
  return <ProfileDetail key={userId} profile={profile} />;
}
