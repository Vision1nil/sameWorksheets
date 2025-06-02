export interface SavedWorksheet {
  id: string;
  userId: string;
  title: string;
  grade: string;
  type: 'grammar' | 'vocabulary' | 'readingComprehension';
  topics: string[];
  instructions: string;
  questions: Array<{
    id: number;
    type: 'multiple-choice' | 'fill-blank' | 'short-answer' | 'essay';
    question: string;
    options?: string[];
    answer?: string;
  }>;
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: string;
  updatedAt: string;
  settings: {
    timeLimit?: number;
    showHints?: boolean;
    allowRetries?: boolean;
    includeAnswerKey?: boolean;
  };
  progress?: {
    completed: boolean;
    score?: number;
    timeSpent?: number;
    lastAttempt?: string;
    answeredQuestions?: number;
  };
}

export interface WorksheetProgress {
  worksheetId: string;
  userId: string;
  completed: boolean;
  score?: number;
  timeSpent?: number;
  lastAttempt: string;
  answeredQuestions: number;
  totalQuestions: number;
  answers?: Record<string, string>;
}

export interface WorksheetFilter {
  grade?: string;
  type?: 'grammar' | 'vocabulary' | 'readingComprehension';
  difficulty?: 'easy' | 'medium' | 'hard';
  topics?: string[];
  completed?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}
