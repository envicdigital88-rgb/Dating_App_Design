import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ ok: false, error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const admin = await db.orm.public.User.where({ id: session.userId as string }).first();
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { userId } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ ok: false, error: 'Invalid payload: userId is required.' }, { status: 400 });
    }

    if (userId === admin.id) {
      return NextResponse.json({ ok: false, error: 'You cannot delete your own administrator account.' }, { status: 400 });
    }

    const targetUser = await db.orm.public.User.where({ id: userId }).first();
    if (!targetUser) {
      return NextResponse.json({ ok: false, error: 'Target member not found.' }, { status: 404 });
    }

    if (targetUser.role === 'admin' && admin.email !== 'envicdigital88@gmail.com') {
      return NextResponse.json({ ok: false, error: 'Only the super administrator can manage admin accounts.' }, { status: 403 });
    }

    // 1. Delete mingles sent by the target user
    await db.runtime().execute(
      db.sql.public.mingle
        .delete()
        .where((f, fns) => fns.eq(f.senderId, userId))
        .build()
    );

    // 2. Delete all conversations involving target user
    await db.runtime().execute(
      db.sql.public.conversation
        .delete()
        .where((f, fns) => fns.or(fns.eq(f.userId1, userId), fns.eq(f.userId2, userId)))
        .build()
    );

    // 3. Delete all connections involving target user
    await db.runtime().execute(
      db.sql.public.connection
        .delete()
        .where((f, fns) => fns.or(fns.eq(f.userId1, userId), fns.eq(f.userId2, userId)))
        .build()
    );

    // 4. Delete photos
    await db.runtime().execute(
      db.sql.public.photo
        .delete()
        .where((f, fns) => fns.eq(f.userId, userId))
        .build()
    );

    // 5. Delete prompts
    await db.runtime().execute(
      db.sql.public.prompt
        .delete()
        .where((f, fns) => fns.eq(f.userId, userId))
        .build()
    );

    // 6. Delete userStatus
    await db.runtime().execute(
      db.sql.public.userStatus
        .delete()
        .where((f, fns) => fns.eq(f.userId, userId))
        .build()
    );

    // 7. Delete usage
    await db.runtime().execute(
      db.sql.public.usage
        .delete()
        .where((f, fns) => fns.eq(f.userId, userId))
        .build()
    );

    // 8. Delete notifications
    await db.runtime().execute(
      db.sql.public.notification
        .delete()
        .where((f, fns) => fns.eq(f.userId, userId))
        .build()
    );

    // 9. Delete likes
    await db.runtime().execute(
      db.sql.public.like
        .delete()
        .where((f, fns) => fns.or(fns.eq(f.fromUserId, userId), fns.eq(f.toUserId, userId)))
        .build()
    );

    // 10. Delete passes
    await db.runtime().execute(
      db.sql.public.pass
        .delete()
        .where((f, fns) => fns.or(fns.eq(f.userId, userId), fns.eq(f.targetUserId, userId)))
        .build()
    );

    // 11. Delete heartBucket
    await db.runtime().execute(
      db.sql.public.heartBucket
        .delete()
        .where((f, fns) => fns.or(fns.eq(f.userId, userId), fns.eq(f.targetUserId, userId)))
        .build()
    );

    // 12. Delete wingles
    await db.runtime().execute(
      db.sql.public.wingle
        .delete()
        .where((f, fns) => fns.or(fns.eq(f.fromUserId, userId), fns.eq(f.toUserId, userId)))
        .build()
    );

    // 13. Delete secret wingles
    await db.runtime().execute(
      db.sql.public.secretWingle
        .delete()
        .where((f, fns) => fns.eq(f.senderId, userId))
        .build()
    );

    // 14. Delete reports
    await db.runtime().execute(
      db.sql.public.report
        .delete()
        .where((f, fns) => fns.or(fns.eq(f.reporterId, userId), fns.eq(f.targetUserId, userId)))
        .build()
    );

    // 15. Delete blocks
    await db.runtime().execute(
      db.sql.public.block
        .delete()
        .where((f, fns) => fns.or(fns.eq(f.blockerId, userId), fns.eq(f.blockedUserId, userId)))
        .build()
    );

    // 16. Delete subscriptions
    await db.runtime().execute(
      db.sql.public.subscription
        .delete()
        .where((f, fns) => fns.eq(f.userId, userId))
        .build()
    );

    // 17. Delete payments
    await db.runtime().execute(
      db.sql.public.payment
        .delete()
        .where((f, fns) => fns.eq(f.userId, userId))
        .build()
    );

    // 18. Delete wingits transactions
    await db.runtime().execute(
      db.sql.public.wingitsTransaction
        .delete()
        .where((f, fns) => fns.eq(f.userId, userId))
        .build()
    );

    // 19. Delete transaction ledgers
    await db.runtime().execute(
      db.sql.public.transactionLedger
        .delete()
        .where((f, fns) => fns.eq(f.userId, userId))
        .build()
    );

    // 20. Delete user record
    await db.runtime().execute(
      db.sql.public.user
        .delete()
        .where((f, fns) => fns.eq(f.id, userId))
        .build()
    );

    return NextResponse.json({
      ok: true,
      message: `Member ${targetUser.name} deleted successfully`
    });
  } catch (error: any) {
    console.error('API /api/admin/users/delete error:', error);
    return NextResponse.json({ ok: false, error: error?.message || 'Failed to delete member' }, { status: 500 });
  }
}
