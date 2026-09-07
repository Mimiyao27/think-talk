import { PracticeTemplate } from '@/types';

export const PRACTICE_TEMPLATES: PracticeTemplate[] = [
  {
    id: 'self-intro',
    title: 'Self Introduction',
    category: 'Daily Speaking',
    level: 'Beginner - Intermediate',
    promptText: "Hi, everyone! I’m ______, but you can call me ______. I’m ___ years old and I’m from ______. My hobbies are ______, ______, and ______. My favorite subject is ______ because ______. Nice to meet you all!",
    blankCount: 9,
    expectedPattern: [
      { slotIndex: 1, placeholder: 'Full Name', description: 'Your real or full name', sampleAnswers: ['Alex Johnson', 'Maria Santos', 'David Lee', 'Sarah Connor'] },
      { slotIndex: 2, placeholder: 'Nickname', description: 'What people call you', sampleAnswers: ['Alex', 'Ria', 'Dave', 'Sari'] },
      { slotIndex: 3, placeholder: 'Age', description: 'Your age in numbers or words', sampleAnswers: ['12', '14', '10', 'fifteen', 'sixteen'] },
      { slotIndex: 4, placeholder: 'Hometown / Country', description: 'Where you are from', sampleAnswers: ['California', 'Manila', 'Tokyo', 'London', 'New York'] },
      { slotIndex: 5, placeholder: 'Hobby 1', description: 'First favorite activity', sampleAnswers: ['playing basketball', 'reading', 'drawing', 'gaming'] },
      { slotIndex: 6, placeholder: 'Hobby 2', description: 'Second favorite activity', sampleAnswers: ['cooking', 'swimming', 'singing', 'coding'] },
      { slotIndex: 7, placeholder: 'Hobby 3', description: 'Third favorite activity', sampleAnswers: ['cycling', 'dancing', 'listening to music', 'photography'] },
      { slotIndex: 8, placeholder: 'Favorite Subject', description: 'School subject', sampleAnswers: ['Science', 'English', 'Mathematics', 'Art', 'History'] },
      { slotIndex: 9, placeholder: 'Reason', description: 'Why you like it', sampleAnswers: ['it is very fun and exciting', 'I love learning new words', 'numbers are interesting', 'I love creating art'] }
    ],
    fullExample: "Hi, everyone! I’m Alex Johnson, but you can call me Alex. I’m 12 years old and I’m from New York. My hobbies are reading, drawing, and playing soccer. My favorite subject is Science because it is very fun and exciting. Nice to meet you all!"
  },
  {
    id: 'dream-job',
    title: 'My Dream Career',
    category: 'Future Goals',
    level: 'Beginner',
    promptText: "When I grow up, I want to be a ______ because I love to ______. To achieve this, I will practice ______ every day!",
    blankCount: 3,
    expectedPattern: [
      { slotIndex: 1, placeholder: 'Dream Profession', description: 'The job you want', sampleAnswers: ['software engineer', 'doctor', 'astronaut', 'teacher', 'pilot'] },
      { slotIndex: 2, placeholder: 'Passionate Activity', description: 'What you enjoy doing in that role', sampleAnswers: ['build helpful apps', 'cure sick people', 'explore space', 'teach children'] },
      { slotIndex: 3, placeholder: 'Skill to practice', description: 'Skills you need to develop', sampleAnswers: ['coding', 'biology', 'math and science', 'public speaking'] }
    ],
    fullExample: "When I grow up, I want to be a software engineer because I love to build helpful apps. To achieve this, I will practice coding every day!"
  },
  {
    id: 'favorite-food',
    title: 'My Favorite Food',
    category: 'Favorites',
    level: 'Beginner',
    promptText: "My all-time favorite food is ______ because it tastes so ______. The best way to enjoy it is with ______.",
    blankCount: 3,
    expectedPattern: [
      { slotIndex: 1, placeholder: 'Favorite dish', description: 'Name of the dish', sampleAnswers: ['homemade pizza', 'ramen', 'chocolate ice cream', 'crispy chicken'] },
      { slotIndex: 2, placeholder: 'Taste descriptor', description: 'How it tastes', sampleAnswers: ['cheesy and savory', 'warm and delicious', 'sweet and refreshing', 'crunchy and flavorful'] },
      { slotIndex: 3, placeholder: 'Side / accompaniment', description: 'What you eat or drink with it', sampleAnswers: ['a cold iced tea', 'steamed dumplings', 'fresh sprinkles', 'mashed potatoes'] }
    ],
    fullExample: "My all-time favorite food is homemade pizza because it tastes so cheesy and savory. The best way to enjoy it is with a cold iced tea."
  }
];
