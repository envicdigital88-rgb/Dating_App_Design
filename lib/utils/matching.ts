import type { User } from '@/lib/types';

export interface VibeMatchResult {
  score: number; // 0-100
  reasons: string[];
}

export function calculateVibeMatch(userA: User, userB: User): VibeMatchResult {
  if (!userA || !userB) return { score: 0, reasons: [] };

  let score = 0;
  const reasons: string[] = [];

  // 1. Intention (30%)
  if (userA.intention === userB.intention) {
    score += 30;
    reasons.push('Same relationship intention');
  } else if (
    (userA.intention === 'Long-term relationship' && userB.intention === 'Long-term, open to short') ||
    (userA.intention === 'Long-term, open to short' && userB.intention === 'Long-term relationship')
  ) {
    score += 15;
    reasons.push('Similar relationship goals');
  } else if (
    (userA.intention === 'Something casual' && userB.intention === 'Long-term, open to short') ||
    (userA.intention === 'Long-term, open to short' && userB.intention === 'Something casual')
  ) {
    score += 10;
  }

  // 2. Interests (20%)
  const sharedInterests = userA.interests.filter(i => userB.interests.includes(i));
  if (sharedInterests.length > 0) {
    const interestScore = Math.min(20, sharedInterests.length * 5); // 5 points per shared interest, max 20
    score += interestScore;
    
    // Create a reason string for up to 2 shared interests
    if (sharedInterests.length === 1) {
      reasons.push(`Both into ${sharedInterests[0]}`);
    } else {
      reasons.push(`Both into ${sharedInterests[0]} & ${sharedInterests[1]}`);
    }
  }

  // 3. Traits (20%)
  const aTraits = userA.traits || [];
  const bTraits = userB.traits || [];
  const sharedTraits = aTraits.filter(t => bTraits.includes(t));
  
  if (sharedTraits.length > 0) {
    const traitScore = Math.min(20, sharedTraits.length * 7);
    score += traitScore;
    
    // Create a reason for each shared trait (up to 2)
    sharedTraits.slice(0, 2).forEach(trait => {
      // E.g., "Night Owl" -> "Both Night Owls" or "Both Coffee Lovers"
      let pluralized = trait;
      if (trait.endsWith('Person')) pluralized = trait.replace('Person', 'People');
      else if (trait.endsWith('Owl')) pluralized = trait + 's';
      else if (trait.endsWith('Lover')) pluralized = trait + 's';
      else if (trait.endsWith('Drinker')) pluralized = trait + 's';
      else if (trait === 'Introvert' || trait === 'Extrovert' || trait === 'Ambivert') pluralized = trait + 's';
      
      reasons.push(`Both ${pluralized}`);
    });
  }

  // 4. Lifestyle (20%)
  let lifestyleMatches = 0;
  if (userA.lifestyle.drinking === userB.lifestyle.drinking && userA.lifestyle.drinking !== 'Never') {
    lifestyleMatches++;
    reasons.push(userA.lifestyle.drinking === 'Socially' ? 'Both drink socially' : 'Both drink regularly');
  } else if (userA.lifestyle.drinking === 'Never' && userB.lifestyle.drinking === 'Never') {
    lifestyleMatches++;
    reasons.push('Neither drink');
  }

  if (userA.lifestyle.smoking === userB.lifestyle.smoking && userA.lifestyle.smoking !== 'Never') {
    lifestyleMatches++;
  } else if (userA.lifestyle.smoking === 'Never' && userB.lifestyle.smoking === 'Never') {
    lifestyleMatches++;
    reasons.push('Neither smoke');
  }

  if (userA.lifestyle.exercise === userB.lifestyle.exercise) {
    lifestyleMatches++;
  }
  
  if (userA.lifestyle.pets !== 'None' && userB.lifestyle.pets !== 'None') {
    lifestyleMatches++;
    if (userA.lifestyle.pets === userB.lifestyle.pets) {
      reasons.push(`Both have a ${userA.lifestyle.pets.toLowerCase()}`);
    } else {
      reasons.push('Both love pets');
    }
  }

  const lifestyleScore = Math.min(20, lifestyleMatches * 5);
  score += lifestyleScore;

  // 5. Location (10%)
  if (userA.location && userB.location && userA.location.toLowerCase() === userB.location.toLowerCase()) {
    score += 10;
    reasons.push('Live in the same area');
  }

  // 6. Prompts (15% per shared answer)
  const aPrompts = userA.prompts || [];
  const bPrompts = userB.prompts || [];
  aPrompts.forEach(aPrompt => {
    const shared = bPrompts.find(bPrompt => bPrompt.question === aPrompt.question && bPrompt.answer === aPrompt.answer);
    if (shared) {
      score += 15;
      reasons.unshift(`Both chose "${aPrompt.answer}"`); // unshift to put it at the top of the reasons list
    }
  });

  // Cap at 99% for realism (nobody is 100% perfect match)
  // Or 100% if they literally match on everything, but 98-99 is better visually.
  score = Math.min(99, Math.round(score));
  
  // Floor to 15% so it's not completely demoralizing
  score = Math.max(15, score);

  return {
    score,
    // Sort reasons to put Traits first, then Intention, then Interests, then Lifestyle
    reasons: Array.from(new Set(reasons)).slice(0, 3) // Return top 3 unique reasons
  };
}
