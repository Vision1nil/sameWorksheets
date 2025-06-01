import { createClient } from '@supabase/supabase-js';

// These would typically be in environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jlnkvynpjnsfbwqndoft.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impsbmt2eW5wam5zZmJ3cW5kb2Z0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NTAwOTAsImV4cCI6MjA2NDMyNjA5MH0.Z_47SX9blo2TQb5oovNP-Ee-g5LYm2oOrgzusLtx0yA';

// Create a single supabase client for the entire app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database schema types
export type WorksheetType = 'grammar' | 'vocabulary' | 'readingComprehension';
export type QuestionType = 'multiple-choice' | 'fill-blank' | 'short-answer' | 'essay' | 'true-false';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface Database {
  public: {
    Tables: {
      worksheets: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          grade: string;
          type: WorksheetType;
          topics: string[];
          difficulty: DifficultyLevel;
          questions: any; // JSON
          settings: any; // JSON
          created_at: string;
          updated_at: string;
        };
      };
      student_progress: {
        Row: {
          id: string;
          user_id: string;
          worksheet_id: string;
          score: number;
          total_questions: number;
          time_spent: number;
          completed_at: string;
          answers: any; // JSON
        };
      };
      // Classroom and assignment tables removed for student-only application
      user_roles: {
        Row: {
          user_id: string;
          role: 'student'; // Only student role is supported
          metadata: any; // JSON
        };
      };
    };
  };
}
