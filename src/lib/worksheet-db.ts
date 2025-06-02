import { supabase } from './supabase';
import { User } from '@clerk/nextjs/server';

/**
 * Save user's answers to a worksheet
 */
export async function saveUserAnswers(
  worksheetId: string, 
  userId: string, 
  userAnswers: Record<string, any>
) {
  const { data, error } = await supabase
    .from('worksheets')
    .update({ 
      user_answers: userAnswers,
      updated_at: new Date().toISOString()
    })
    .eq('id', worksheetId)
    .eq('user_id', userId);
    
  if (error) throw error;
  return data;
}

/**
 * Save grading results for a worksheet
 */
export async function saveGradingResults(
  worksheetId: string,
  userId: string,
  gradingResults: Record<string, any>,
  score: number
) {
  const { data, error } = await supabase
    .from('worksheets')
    .update({
      grading_results: gradingResults,
      score: score,
      last_graded_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', worksheetId)
    .eq('user_id', userId);
    
  if (error) throw error;
  return data;
}

/**
 * Get a worksheet with user's answers and grading results
 */
export async function getWorksheetWithUserAnswers(worksheetId: string, userId: string) {
  const { data, error } = await supabase
    .from('worksheets')
    .select('*')
    .eq('id', worksheetId)
    .eq('user_id', userId)
    .single();
    
  if (error) throw error;
  return data;
}

/**
 * Save a worksheet with question types
 */
export async function saveWorksheetWithQuestionTypes(
  title: string,
  userId: string,
  grade: string,
  type: 'grammar' | 'vocabulary' | 'readingComprehension',
  topics: any[],
  difficulty: 'easy' | 'medium' | 'hard',
  questions: any[],
  settings: any,
  questionTypes: string[]
) {
  const { data, error } = await supabase
    .from('worksheets')
    .insert({
      title,
      user_id: userId,
      grade,
      type,
      topics,
      difficulty,
      questions,
      settings,
      question_types: questionTypes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

/**
 * Update an existing worksheet's question types
 */
export async function updateWorksheetQuestionTypes(
  worksheetId: string,
  userId: string,
  questionTypes: string[]
) {
  const { data, error } = await supabase
    .from('worksheets')
    .update({ 
      question_types: questionTypes,
      updated_at: new Date().toISOString()
    })
    .eq('id', worksheetId)
    .eq('user_id', userId);
    
  if (error) throw error;
  return data;
}

/**
 * Get worksheets with grading information
 */
export async function getWorksheetListWithGrades(userId: string) {
  const { data, error } = await supabase
    .from('worksheets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  
  return data.map((worksheet: any) => ({
    id: worksheet.id,
    title: worksheet.title,
    grade: worksheet.grade,
    type: worksheet.type,
    topics: worksheet.topics || [],
    difficulty: worksheet.difficulty,
    createdAt: new Date(worksheet.created_at),
    lastAttemptedAt: worksheet.updated_at ? new Date(worksheet.updated_at) : undefined,
    lastGradedAt: worksheet.last_graded_at ? new Date(worksheet.last_graded_at) : undefined,
    score: worksheet.score,
    questionTypes: worksheet.question_types || []
  }));
}
