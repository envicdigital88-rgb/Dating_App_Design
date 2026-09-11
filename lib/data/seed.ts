import type {
  AppNotification,
  Connection,
  Conversation,
  WinglingWingle,
  Like,
  Mingle,
  Payment,
  Photo,
  Report,
  User } from
'@/lib/types';

const IMG = {
  hero: "/41c76259-ba28-4b8f-a0f0-db6538f534a4.jpg",
  m1: "/bf56ca20-f1ba-4389-b077-5dd2b87fea1a.jpg",
  m2: "/1c431905-aa37-4fc6-b496-fb7d645f0ac4.jpg",
  m3: "/48937fea-dd66-489e-8b1d-b26648904cae.jpg",
  m4: "/59e46d67-92ab-4288-87f5-02276c07150f.jpg",
  m5: "/2b6c1991-02ec-4c41-b06a-1861b2c69e84.jpg",
  m6: "/1bab1e82-4014-406c-b58a-ec85df45a239.jpg",
  m7: "/17d413ab-650f-4ad5-9a63-161fee03322e.jpg",
  m8: "/f80d01b8-9234-4d03-91c3-088e6fbf2ac5.jpg",
  lifestyle: "/133ac618-2e06-4057-95e1-b01408dda418.jpg"
};

export const heroImage = IMG.hero;
export const lifestyleImage = IMG.lifestyle;

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
const hoursAgo = (n: number) => new Date(Date.now() - n * 3_600_000).toISOString();
const minsAgo = (n: number) => new Date(Date.now() - n * 60_000).toISOString();

const baseLifestyle = {
  drinking: 'Socially',
  smoking: 'Never',
  exercise: 'Often',
  pets: 'Dog',
  children: 'None',
  education: 'Undergraduate',
  work: 'Product designer'
};

type SeedMember = Omit<User, 'password' | 'role' | 'onboarded' | 'traits' | 'prompts'> & {photos: string[];};

const members: SeedMember[] = [
{
  id: 'u-1',
  name: 'Priya',
  email: 'priya@example.com',
  phone: '+44 7700 900101',
  age: 29,
  gender: 'woman',
  location: 'Shoreditch, London',
  bio: 'Architect by day, terrible karaoke singer by night. I will absolutely drag you to a Sunday market.',
  intention: 'Long-term relationship',
  interests: ['Live music', 'Street food', 'Film photography', 'Sea swimming'],
  lifestyle: { ...baseLifestyle, work: 'Architect', exercise: 'Sometimes' },
  verified: true,
  suspended: false,
  online: true,
  lastActiveAt: minsAgo(2),
  createdAt: daysAgo(140),
  photos: [IMG.m1, IMG.lifestyle, IMG.m3]
},
{
  id: 'u-2',
  name: 'Dev',
  email: 'dev@example.com',
  phone: '+44 7700 900102',
  age: 32,
  gender: 'man',
  location: 'Peckham, London',
  bio: 'I cook far too much food for one person, so bring an appetite. Long walks, longer playlists.',
  intention: 'Long-term, open to short',
  interests: ['Cooking', 'Cycling', 'Podcasts', 'Coffee'],
  lifestyle: { ...baseLifestyle, work: 'Chef de partie', pets: 'None' },
  verified: true,
  suspended: false,
  online: false,
  lastActiveAt: minsAgo(320),
  createdAt: daysAgo(96),
  photos: [IMG.m2, IMG.lifestyle]
},
{
  id: 'u-3',
  name: 'Mei',
  email: 'mei@example.com',
  phone: '+44 7700 900103',
  age: 30,
  gender: 'woman',
  location: 'Hackney, London',
  bio: 'Plant hoarder, slow-morning enthusiast, always the one who finds the good bakery.',
  intention: 'Long-term relationship',
  interests: ['Baking', 'Pottery', 'Reading', 'Art galleries'],
  lifestyle: { ...baseLifestyle, work: 'Illustrator', exercise: 'Sometimes', pets: 'Cat' },
  verified: false,
  suspended: false,
  online: true,
  lastActiveAt: minsAgo(6),
  createdAt: daysAgo(58),
  photos: [IMG.m3, IMG.m1]
},
{
  id: 'u-4',
  name: 'Marcus',
  email: 'marcus@example.com',
  phone: '+44 7700 900104',
  age: 33,
  gender: 'man',
  location: 'Brixton, London',
  bio: 'Five-a-side on Tuesdays, vinyl digging on Saturdays. Ask me about the best jollof in south London.',
  intention: 'Long-term relationship',
  interests: ['Football', 'Live music', 'Street food', 'Travel'],
  lifestyle: { ...baseLifestyle, work: 'Physiotherapist', exercise: 'Daily' },
  verified: true,
  suspended: false,
  online: false,
  lastActiveAt: minsAgo(90),
  createdAt: daysAgo(210),
  photos: [IMG.m4, IMG.lifestyle]
},
{
  id: 'u-5',
  name: 'Sophie',
  email: 'sophie@example.com',
  phone: '+44 7700 900105',
  age: 28,
  gender: 'woman',
  location: 'Margate, Kent',
  bio: 'Cold water swimmer, warm pub advocate. I moved to the coast and never looked back.',
  intention: 'Long-term, open to short',
  interests: ['Sea swimming', 'Running', 'Dog walks', 'Wine tasting'],
  lifestyle: { ...baseLifestyle, work: 'Marine biologist', exercise: 'Daily' },
  verified: true,
  suspended: false,
  online: true,
  lastActiveAt: minsAgo(1),
  createdAt: daysAgo(31),
  photos: [IMG.m5, IMG.lifestyle]
},
{
  id: 'u-6',
  name: 'Tomás',
  email: 'tomas@example.com',
  phone: '+44 7700 900106',
  age: 29,
  gender: 'man',
  location: 'Camden, London',
  bio: 'Bookshop loiterer. I will lend you something and expect a full review over dinner.',
  intention: 'Long-term relationship',
  interests: ['Reading', 'Theatre', 'Coffee', 'Board games'],
  lifestyle: { ...baseLifestyle, work: 'Editor', exercise: 'Sometimes', pets: 'Cat' },
  verified: false,
  suspended: false,
  online: false,
  lastActiveAt: minsAgo(1400),
  createdAt: daysAgo(74),
  photos: [IMG.m6, IMG.lifestyle]
},
{
  id: 'u-7',
  name: 'Cleo',
  email: 'cleo@example.com',
  phone: '+44 7700 900107',
  age: 31,
  gender: 'woman',
  location: 'Islington, London',
  bio: 'Straight-talking, quick to laugh. Weekends are for galleries, negronis and terrible reality TV.',
  intention: 'Long-term relationship',
  interests: ['Art galleries', 'Wine tasting', 'Travel', 'Dancing'],
  lifestyle: { ...baseLifestyle, work: 'Barrister', education: 'Postgraduate', pets: 'None' },
  verified: true,
  suspended: false,
  online: true,
  lastActiveAt: minsAgo(12),
  createdAt: daysAgo(18),
  photos: [IMG.m7, IMG.lifestyle]
},
{
  id: 'u-8',
  name: 'Owen',
  email: 'owen@example.com',
  phone: '+44 7700 900108',
  age: 35,
  gender: 'man',
  location: 'Walthamstow, London',
  bio: 'Sourdough, allotment, two rescue greyhounds. Genuinely happy and looking for someone to share it.',
  intention: 'Long-term relationship',
  interests: ['Gardening', 'Baking', 'Cycling', 'Dog walks'],
  lifestyle: { ...baseLifestyle, work: 'Software engineer', children: 'Want kids' },
  photos: [IMG.m8, IMG.lifestyle],
  verified: true,
  suspended: false,
  online: false,
  lastActiveAt: minsAgo(240),
  createdAt: daysAgo(320)
}];


export const DEMO_USER_ID = 'u-me';
export const ADMIN_USER_ID = 'u-admin';

export const seedUsers: User[] = [
{
  id: DEMO_USER_ID,
  name: 'Alex',
  email: 'demo@winglemingle.app',
  phone: '+44 7700 900001',
  password: 'winglemingle123',
  role: 'member',
  age: 30,
  gender: 'non-binary',
  location: 'Bethnal Green, London',
  bio: 'Runs on flat whites and long walks. Looking for someone to lose a whole Saturday with.',
  intention: 'Long-term relationship',
  interests: ['Coffee', 'Live music', 'Hiking', 'Cooking', 'Film photography'],
  traits: ['Coffee Lover', 'Early Bird', 'Go Out'],
  prompts: [{ id: 'p1', question: 'I go crazy for...', answer: 'A good flat white.' }],
  lifestyle: { ...baseLifestyle, work: 'Product designer' },
  verified: true,
  suspended: false,
  onboarded: true,
  online: true,
  lastActiveAt: new Date().toISOString(),
  createdAt: daysAgo(12)
},
{
  id: ADMIN_USER_ID,
  name: 'Rowan (Admin)',
  email: 'admin@winglemingle.app',
  phone: '+44 7700 900000',
  password: 'admin123',
  role: 'admin',
  age: 38,
  gender: 'non-binary',
  location: 'Wingle Mingle HQ',
  bio: 'Trust & safety.',
  intention: 'Long-term relationship',
  interests: [],
  traits: [],
  prompts: [],
  lifestyle: { ...baseLifestyle, work: 'Trust & Safety Lead' },
  verified: true,
  suspended: false,
  onboarded: true,
  online: true,
  lastActiveAt: new Date().toISOString(),
  createdAt: daysAgo(400)
},
...members.map(({ photos, ...m }) => ({
  ...m,
  password: 'member123',
  role: 'member' as const,
  traits: [],
  prompts: [],
  onboarded: true
}))];


export const seedPhotos: Photo[] = [
...members.flatMap((m) =>
m.photos.map((url, i) => ({
  id: `ph-${m.id}-${i}`,
  userId: m.id,
  url,
  order: i,
  isPrimary: i === 0,
  moderation: (m.id === 'u-6' && i === 1 ? 'pending' : 'approved') as Photo['moderation'],
  uploadedAt: daysAgo(20 - i)
}))
),
{
  id: 'ph-me-0',
  userId: DEMO_USER_ID,
  url: IMG.hero,
  order: 0,
  isPrimary: true,
  moderation: 'approved',
  uploadedAt: daysAgo(12)
},
{
  id: 'ph-me-1',
  userId: DEMO_USER_ID,
  url: IMG.lifestyle,
  order: 1,
  isPrimary: false,
  moderation: 'approved',
  uploadedAt: daysAgo(11)
}];


export const seedLikes: Like[] = [
{ id: 'lk-1', fromUserId: 'u-5', toUserId: DEMO_USER_ID, createdAt: daysAgo(1) },
{ id: 'lk-2', fromUserId: 'u-3', toUserId: DEMO_USER_ID, createdAt: daysAgo(2) },
{ id: 'lk-3', fromUserId: 'u-8', toUserId: DEMO_USER_ID, createdAt: daysAgo(4) },
{ id: 'lk-4', fromUserId: DEMO_USER_ID, toUserId: 'u-1', createdAt: daysAgo(3) }];


export const seedWingles: WinglingWingle[] = [
{
  id: 'rq-1',
  fromUserId: DEMO_USER_ID,
  toUserId: 'u-1',
  note: 'Your market photos are unreal — Sunday coffee somewhere?',
  status: 'accepted',
  createdAt: daysAgo(5),
  respondedAt: daysAgo(4)
},
{
  id: 'rq-2',
  fromUserId: DEMO_USER_ID,
  toUserId: 'u-4',
  note: 'I need that jollof recommendation, purely for research.',
  status: 'pending',
  createdAt: daysAgo(2)
},
{
  id: 'rq-3',
  fromUserId: DEMO_USER_ID,
  toUserId: 'u-6',
  note: 'Lend me a book, I promise a full review.',
  status: 'declined',
  createdAt: daysAgo(8),
  respondedAt: daysAgo(7)
},
{
  id: 'rq-4',
  fromUserId: 'u-7',
  toUserId: DEMO_USER_ID,
  note: 'Your bio made me laugh. Negroni sometime?',
  status: 'pending',
  createdAt: daysAgo(1)
},
{
  id: 'rq-5',
  fromUserId: 'u-5',
  toUserId: DEMO_USER_ID,
  note: 'Fancy a very cold swim followed by a very warm pub?',
  status: 'pending',
  createdAt: minsAgo(180)
},
{
  id: 'rq-6',
  fromUserId: 'u-2',
  toUserId: DEMO_USER_ID,
  note: 'I cooked too much again. Help.',
  status: 'pending',
  createdAt: daysAgo(3)
}];


export const seedConnections: Connection[] = [
{ id: 'cn-1', userIds: [DEMO_USER_ID, 'u-1'], createdAt: daysAgo(4) },
{ id: 'cn-2', userIds: [DEMO_USER_ID, 'u-2'], createdAt: daysAgo(2) },
{ id: 'cn-3', userIds: [DEMO_USER_ID, 'u-3'], createdAt: daysAgo(1) },
{ id: 'cn-4', userIds: [DEMO_USER_ID, 'u-5'], createdAt: hoursAgo(5) }
];


export const seedConversations: Conversation[] = [
{ id: 'cv-1', userIds: [DEMO_USER_ID, 'u-1'], createdAt: daysAgo(4), lastMingleAt: minsAgo(8) },
{ id: 'cv-2', userIds: [DEMO_USER_ID, 'u-2'], createdAt: daysAgo(2), lastMingleAt: hoursAgo(12) },
{ id: 'cv-3', userIds: [DEMO_USER_ID, 'u-3'], createdAt: daysAgo(1), lastMingleAt: minsAgo(45) },
{ id: 'cv-4', userIds: [DEMO_USER_ID, 'u-5'], createdAt: hoursAgo(5), lastMingleAt: hoursAgo(2) }
];


export const seedMingles: Mingle[] = [
{
  id: 'ms-1',
  conversationId: 'cv-1',
  senderId: 'u-1',
  body: 'Okay, wingle accepted — mostly for the karaoke potential.',
  createdAt: daysAgo(4),
  readAt: daysAgo(4),
  deleted: false
},
{
  id: 'ms-2',
  conversationId: 'cv-1',
  senderId: DEMO_USER_ID,
  body: 'I have one song and I have ruined it for everyone. Coffee first, though?',
  createdAt: daysAgo(4),
  readAt: daysAgo(3),
  deleted: false
},
{
  id: 'ms-3',
  conversationId: 'cv-1',
  senderId: 'u-1',
  body: 'There is a place on Columbia Road that does an unreasonable cardamom bun.',
  createdAt: daysAgo(3),
  readAt: daysAgo(3),
  deleted: false
},
{
  id: 'ms-4',
  conversationId: 'cv-1',
  senderId: 'u-1',
  body: 'Sunday, 11am?',
  imageUrl: IMG.lifestyle,
  createdAt: minsAgo(8),
  readAt: null,
  deleted: false
},
{
  id: 'ms-5',
  conversationId: 'cv-2',
  senderId: 'u-2',
  body: 'Hey! Loved your prompt about the best hidden spots in the city. Where should we start?',
  createdAt: hoursAgo(12),
  readAt: hoursAgo(10),
  deleted: false
},
{
  id: 'ms-6',
  conversationId: 'cv-3',
  senderId: DEMO_USER_ID,
  body: 'Are you going to the food festival this weekend?',
  createdAt: hoursAgo(2),
  readAt: minsAgo(60),
  deleted: false
},
{
  id: 'ms-7',
  conversationId: 'cv-3',
  senderId: 'u-3',
  body: 'Yes definitely! We should grab a bite together if you are around 🌮',
  createdAt: minsAgo(45),
  readAt: null,
  deleted: false
},
{
  id: 'ms-8',
  conversationId: 'cv-4',
  senderId: 'u-5',
  body: 'Hi there! Nice to connect with you. Have a great day!',
  createdAt: hoursAgo(2),
  readAt: null,
  deleted: false
}];


export const seedNotifications: AppNotification[] = [
{
  id: 'nt-1',
  userId: DEMO_USER_ID,
  type: 'wingle_received',
  title: 'Someone wants to connect',
  body: 'A new wingling wingle is waiting for you.',
  createdAt: minsAgo(180),
  read: false,
  href: '/wingles'
},
{
  id: 'nt-2',
  userId: DEMO_USER_ID,
  type: 'mingle',
  title: 'New mingle from Priya',
  body: 'Sunday, 11am?',
  createdAt: minsAgo(8),
  read: false,
  href: '/mingles'
},
{
  id: 'nt-3',
  userId: DEMO_USER_ID,
  type: 'like',
  title: 'Sophie liked your profile',
  body: 'Have a look and like back if you are curious.',
  createdAt: daysAgo(1),
  read: true,
  href: '/likes'
}];


export const seedPayments: Payment[] = [
{
  id: 'pay-1',
  userId: 'u-1',
  packageId: 'pkg-premium',
  amount: 29.99,
  status: 'succeeded',
  method: 'Visa •••• 4242',
  reference: 'KDR-8812-AA',
  createdAt: daysAgo(9)
},
{
  id: 'pay-2',
  userId: 'u-4',
  packageId: 'pkg-basic',
  amount: 14.99,
  status: 'succeeded',
  method: 'Mastercard •••• 5311',
  reference: 'KDR-8790-QP',
  createdAt: daysAgo(14)
},
{
  id: 'pay-3',
  userId: 'u-6',
  packageId: 'pkg-basic',
  amount: 14.99,
  status: 'failed',
  method: 'Visa •••• 1102',
  reference: 'KDR-8744-ZR',
  createdAt: daysAgo(16)
},
{
  id: 'pay-4',
  userId: 'u-7',
  packageId: 'pkg-premium',
  amount: 29.99,
  status: 'refunded',
  method: 'Amex •••• 0007',
  reference: 'KDR-8611-LM',
  createdAt: daysAgo(25)
}];


export const seedReports: Report[] = [
{
  id: 'rp-1',
  reporterId: 'u-3',
  targetUserId: 'u-6',
  reason: 'Inappropriate photo',
  detail: 'Second gallery photo looks like a stock image.',
  context: 'photo',
  status: 'open',
  createdAt: daysAgo(2)
},
{
  id: 'rp-2',
  reporterId: 'u-5',
  targetUserId: 'u-2',
  reason: 'Spam or scam',
  detail: 'Asked to move to another app immediately.',
  context: 'chat',
  status: 'open',
  createdAt: daysAgo(6)
}];


export const testimonials = [
{
  quote:
  'The locked wingles actually made me slow down. I read three profiles properly instead of swiping through ninety.',
  name: 'Hana & Joe',
  detail: 'Together 14 months · met on Wingle Mingle'
},
{
  quote:
  'Paying for mingles sounds odd until you realise every conversation you have is with someone who also meant it.',
  name: 'Femi',
  detail: 'Bristol · Premium member'
},
{
  quote: 'I sent four wingles, had two real dates, and deleted the app. That is the point, right?',
  name: 'Cora',
  detail: 'Manchester · Basic member'
}];


export const faqs = [
{
  q: 'Why do I pay for mingles instead of a flat subscription?',
  a: 'Every package includes a mingle allowance held on your account. It keeps conversations deliberate and stops the copy-paste openers most apps drown in. Your remaining balance is always visible in your dashboard.'
},
{
  q: 'What happens when my chat allowance runs out?',
  a: 'Sending pauses immediately and we show you your package options. Nothing is deleted, your conversations stay exactly where they are, and the moment a payment is verified your balance updates.'
},
{
  q: 'Why can I not see who sent me a wingle?',
  a: 'Incoming wingles are a paid feature. Free members see that a wingle exists and a blurred preview; Basic and Premium members see the person, their note and can reply.'
},
{
  q: 'How is my identity protected?',
  a: 'Profiles are moderated before they are shown, photos are reviewed, and nothing beyond your first name, age and area is ever published. You can block, report or delete your account at any time.'
},
{
  q: 'Do you use personality tests or compatibility scores?',
  a: 'No. There is no questionnaire and no algorithmic score. You look at real profiles and real photos, and you decide.'
},
{
  q: 'Can I install Wingle Mingle on my phone?',
  a: 'Yes. Wingle Mingle is an installable app — add it to your home screen and it runs full screen with offline support and push notifications, no app store required.'
}];