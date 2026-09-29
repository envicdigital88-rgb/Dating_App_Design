'use server'

import { db } from '@/lib/db'

export async function getRandomUsersForLanding() {
  try {
    const allUsers = await db.orm.public.User.where({ role: 'member' })
      .include('photos')
      .all()

    const validUsers = allUsers.filter((u: any) => u.photos?.some((p: any) => p.isPrimary))

    const men = validUsers.filter((u: any) => u.gender === 'man')
    const women = validUsers.filter((u: any) => u.gender === 'woman')
    
    // Shuffle
    const shuffledMen = men.sort(() => 0.5 - Math.random())
    const shuffledWomen = women.sort(() => 0.5 - Math.random())

    const selected = []
    
    let i = 0, j = 0;
    while(selected.length < 15 && (i < shuffledMen.length || j < shuffledWomen.length)) {
      if (j < shuffledWomen.length && selected.length < 15) {
        selected.push(shuffledWomen[j++])
      }
      if (i < shuffledMen.length && selected.length < 15) {
        selected.push(shuffledMen[i++])
      }
    }

    const finalSelection = selected.sort(() => 0.5 - Math.random())

    const fallbacks = [
      "Just here to meet some interesting people and see what happens. Love good food and deep conversations.",
      "Always up for an adventure. Whether it's hiking, trying a new cafe, or just a late-night drive.",
      "Looking for someone to share great moments with. Let's grab a coffee and get to know each other.",
      "Passionate about my work, but I always make time for the good things in life. Say hi!",
      "Simple and easygoing. I believe the best connections start with a simple hello."
    ];

    return finalSelection.map((user: any, index: number) => {
      const primaryPhoto = user.photos?.find((p: any) => p.isPrimary)
      return {
        id: user.id,
        name: user.name,
        age: user.age,
        location: user.location,
        bio: user.bio || fallbacks[index % fallbacks.length],
        photo: primaryPhoto?.url
      }
    })

  } catch (error) {
    console.error('Error fetching random users for landing:', error)
    return []
  }
}
