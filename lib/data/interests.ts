export const interestOptions = [
'Live music',
'Hiking',
'Cooking',
'Film photography',
'Wine tasting',
'Running',
'Yoga',
'Travel',
'Art galleries',
'Reading',
'Sea swimming',
'Board games',
'Cycling',
'Coffee',
'Theatre',
'Baking',
'Pottery',
'Football',
'Podcasts',
'Gardening',
'Dog walks',
'Street food',
'Dancing',
'Climbing'];


export const intentionOptions = [
'Long-term relationship',
'Long-term, open to short',
'Something casual',
'New friends first'] as
const;

export const lifestyleFields = [
{ key: 'drinking', label: 'Drinking', options: ['Never', 'Socially', 'Regularly'] },
{ key: 'smoking', label: 'Smoking', options: ['Never', 'Socially', 'Regularly'] },
{ key: 'exercise', label: 'Exercise', options: ['Rarely', 'Sometimes', 'Often', 'Daily'] },
{ key: 'pets', label: 'Pets', options: ['None', 'Dog', 'Cat', 'Other'] },
{ key: 'children', label: 'Children', options: ['None', 'Have kids', 'Want kids', 'Open to kids'] },
{ key: 'education', label: 'Education', options: ['College', 'Undergraduate', 'Postgraduate', 'Doctorate'] }] as
const;

export const traitOptions = [
  'Night Owl',
  'Early Bird',
  'Introvert',
  'Extrovert',
  'Ambivert',
  'Coffee Lover',
  'Tea Drinker',
  'Beach Person',
  'Mountain Person',
  'Stay In',
  'Go Out'
];

export const promptQuestions = [
  'A controversial opinion I have is...',
  'I go crazy for...',
  'My ideal first date in Colombo...',
  'A random fact I love...',
  'The best place to eat in town is...',
  'If I won the lottery tomorrow I would...',
  'My most irrational fear is...'
];

export const promptAnswers: Record<string, string[]> = {
  'What are your main hobbies?': [
    'Reading & Writing',
    'Sports & Fitness',
    'Gaming & Tech',
    'Arts & Crafts',
    'Travel & Outdoors',
    'Cooking & Baking',
    'Music & Concerts'
  ],
  'What\'s your favorite movie or book?': [
    'Sci-Fi / Fantasy',
    'Romance / Drama',
    'Action / Thriller',
    'Comedy',
    'Documentary / Non-fiction',
    'Horror / Mystery'
  ],
  'A typical weekend for me looks like...': [
    'Relaxing at home',
    'Out with friends',
    'Exploring the city',
    'Working on personal projects',
    'Outdoor adventures',
    'Catching up on sleep'
  ],
  'The most spontaneous thing I\'ve done recently is...': [
    'Booked a last-minute trip',
    'Tried a completely new hobby',
    'Stayed up all night talking',
    'Went to an event I knew nothing about',
    'Ate at a random restaurant'
  ]
};