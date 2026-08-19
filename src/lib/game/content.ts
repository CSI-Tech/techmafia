import fs from 'fs';
import path from 'path';

export interface Question {
  type?: 'MULTIPLE_CHOICE' | 'TYPE_ANSWER';
  question: string;
  options?: string[];
  answer: string;
}

export interface QuestionSet {
  id: string;
  category: string;
  civilian: Question;
  mafia: Question;
}

export interface NightQuiz {
  id: string;
  question: string;
  options: string[];
  answer: string;
}

export interface WordPair {
  id: string;
  civilian: string;
  mafia: string;
}

export function loadRound1Questions(): QuestionSet[] {
  try {
    const filePath = path.join(process.cwd(), 'data', 'final_questions.json');
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data).sets;
  } catch (err) {
    console.error('Failed to load round 1 questions:', err);
    return [];
  }
}

export function loadNightQuizzes(): NightQuiz[] {
  try {
    const filePath = path.join(process.cwd(), 'data', 'nightQuizzes.json');
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data).quizzes;
  } catch (err) {
    console.error('Failed to load night quizzes:', err);
    return [];
  }
}

export function loadWordPairs(): WordPair[] {
  try {
    const filePath = path.join(process.cwd(), 'data', 'wordPairs.json');
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data).pairs;
  } catch (err) {
    console.error('Failed to load word pairs:', err);
    return [];
  }
}
