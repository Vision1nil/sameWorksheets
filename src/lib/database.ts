// Database interfaces for saved worksheets and student progress
// In a real app, this would be replaced with a proper database like PostgreSQL, MongoDB, etc.

export interface SavedWorksheet {
  id: string;
  userId: string;
  title: string;
  grade: string;
  type: 'grammar' | 'vocabulary' | 'readingComprehension';
  topics: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  questions: WorksheetQuestion[];
  settings: DifficultySettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorksheetQuestion {
  id: string;
  type: 'multiple-choice' | 'fill-blank' | 'short-answer' | 'essay' | 'true-false';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
}

export interface DifficultySettings {
  questionCount: number;
  timeLimit: number;
  showAnswerKey: boolean;
  allowHints: boolean;
  allowRetries: boolean;
}

export interface StudentProgress {
  id: string;
  userId: string;
  worksheetId: string;
  score: number;
  totalQuestions: number;
  timeSpent: number; // in seconds
  completedAt: Date;
  answers: StudentAnswer[];
}

export interface StudentAnswer {
  questionId: string;
  answer: string | string[];
  isCorrect: boolean;
  timeSpent: number;
}

// Student-only application no longer needs classroom interface

export interface UserRole {
  userId: string;
  role: 'student';
  metadata?: Record<string, any>;
}

// Empty data storage (in memory)
const savedWorksheets: SavedWorksheet[] = [];
const studentProgress: StudentProgress[] = [];
// Student-only application no longer needs classrooms array
const userRoles: UserRole[] = [];

// User Role Management
export async function getUserRole(userId: string): Promise<UserRole | null> {
  return userRoles.find(role => role.userId === userId) || null;
}

export async function setUserRole(userId: string, role: 'student' = 'student', metadata?: UserRole['metadata']): Promise<UserRole> {
  // In student-only app, role parameter is ignored and always set to 'student'
  const existingRole = userRoles.find(r => r.userId === userId);
  if (existingRole) {
    existingRole.metadata = metadata;
    return existingRole;
  }
  const newRole: UserRole = { userId, role: 'student', metadata };
  userRoles.push(newRole);
  return newRole;
}

export async function isStudent(userId: string): Promise<boolean> {
  return true; // All users are students in this application
}

// Worksheet Management
export async function saveWorksheet(worksheet: Omit<SavedWorksheet, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedWorksheet> {
  const newWorksheet: SavedWorksheet = {
    ...worksheet,
    id: `worksheet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  savedWorksheets.push(newWorksheet);
  return newWorksheet;
}

export async function getUserWorksheets(userId: string): Promise<SavedWorksheet[]> {
  return savedWorksheets.filter(worksheet => worksheet.userId === userId);
}

export async function getWorksheetById(id: string, userId: string): Promise<SavedWorksheet | null> {
  const worksheet = savedWorksheets.find(w => w.id === id);
  if (!worksheet) return null;
  
  // Check if user has access to this worksheet
  const userRole = await getUserRole(userId);
  if (worksheet.userId === userId) {
    return worksheet;
  }
  
  return null;
}

export async function deleteWorksheet(id: string, userId: string): Promise<boolean> {
  const index = savedWorksheets.findIndex(w => w.id === id && w.userId === userId);
  if (index === -1) return false;
  
  savedWorksheets.splice(index, 1);
  return true;
}

// Student Progress Management
export async function saveStudentProgress(progress: Omit<StudentProgress, 'id'>): Promise<StudentProgress> {
  const newProgress: StudentProgress = {
    ...progress,
    id: `progress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
  
  studentProgress.push(newProgress);
  return newProgress;
}

export async function getStudentProgress(userId: string): Promise<StudentProgress[]> {
  return studentProgress.filter(progress => progress.userId === userId);
}

export async function getWorksheetProgress(worksheetId: string, userId: string): Promise<StudentProgress[]> {
  return studentProgress.filter(progress => 
    progress.worksheetId === worksheetId && progress.userId === userId
  );
}

// Classroom Management functions removed - student-only application

// Analytics and Reporting
export interface AnalyticsData {
  totalWorksheets: number;
  totalAttempts: number;
  averageScore: number;
  topicPerformance: { topic: string; averageScore: number; attempts: number }[];
  recentActivity: StudentProgress[];
}

export async function getUserAnalytics(userId: string): Promise<AnalyticsData> {
  const userWorksheets = await getUserWorksheets(userId);
  const userProgress = await getStudentProgress(userId);
  
  const totalWorksheets = userWorksheets.length;
  const totalAttempts = userProgress.length;
  const averageScore = totalAttempts > 0 
    ? userProgress.reduce((sum, p) => sum + (p.score / p.totalQuestions), 0) / totalAttempts * 100
    : 0;
  
  // Calculate topic performance
  const topicPerformance: { [key: string]: { scores: number[]; attempts: number } } = {};
  
  for (const progress of userProgress) {
    const worksheet = userWorksheets.find(w => w.id === progress.worksheetId);
    if (worksheet) {
      for (const topic of worksheet.topics) {
        if (!topicPerformance[topic]) {
          topicPerformance[topic] = { scores: [], attempts: 0 };
        }
        topicPerformance[topic].scores.push(progress.score / progress.totalQuestions * 100);
        topicPerformance[topic].attempts++;
      }
    }
  }
  
  const topicPerformanceArray = Object.entries(topicPerformance).map(([topic, data]) => ({
    topic,
    averageScore: data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length || 0,
    attempts: data.attempts,
  }));
  
  return {
    totalWorksheets,
    totalAttempts,
    averageScore,
    topicPerformance: topicPerformanceArray,
    recentActivity: userProgress.slice(-10), // Last 10 activities
  };
}

// Student Analytics Interface
export interface StudentAnalytics {
  totalWorksheets: number;
  averageScore: number;
  totalTimeSpent: number;
  progressByType: Record<string, { completed: number; averageScore: number }>;
  progressByGrade: Record<string, { completed: number; averageScore: number }>;
  studyStreak: {
    current: number;
    best: number;
    lastStudyDate: Date | null;
  };
}

// Create analytics function for students with improved streak tracking
export async function getStudentAnalytics(studentId: string): Promise<StudentAnalytics> {
  const progress = studentProgress.filter(p => p.userId === studentId);
  const worksheets = savedWorksheets.filter(w => w.userId === studentId);
  
  // Calculate total time spent
  const totalTimeSpent = progress.reduce((total, p) => total + p.timeSpent, 0);
  
  // Calculate average score
  const averageScore = progress.length > 0
    ? progress.reduce((sum, p) => sum + p.score, 0) / progress.length
    : 0;
  
  // Group progress by worksheet type
  const progressByType: Record<string, { completed: number; averageScore: number }> = {};
  const progressByGrade: Record<string, { completed: number; averageScore: number }> = {};
  
  // Initialize with zero values for all types and grades
  const types = ['grammar', 'vocabulary', 'readingComprehension'];
  const grades = ['K', '1', '2', '3', '4', '5', '6', '7', '8'];
  
  types.forEach(type => {
    progressByType[type] = { completed: 0, averageScore: 0 };
  });
  
  grades.forEach(grade => {
    progressByGrade[grade] = { completed: 0, averageScore: 0 };
  });
  
  // Process each progress entry
  for (const p of progress) {
    const worksheet = savedWorksheets.find(w => w.id === p.worksheetId);
    if (worksheet) {
      const type = worksheet.type;
      const grade = worksheet.grade;
      
      // Update type statistics
      progressByType[type].completed += 1;
      progressByType[type].averageScore = (
        (progressByType[type].averageScore * (progressByType[type].completed - 1)) + p.score
      ) / progressByType[type].completed;
      
      // Update grade statistics
      progressByGrade[grade].completed += 1;
      progressByGrade[grade].averageScore = (
        (progressByGrade[grade].averageScore * (progressByGrade[grade].completed - 1)) + p.score
      ) / progressByGrade[grade].completed;
    }
  }
  
  // Calculate study streak
  const sortedProgress = [...progress].sort((a, b) => 
    new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
  
  const studyStreak = calculateStudyStreak(sortedProgress);
  
  return {
    totalWorksheets: worksheets.length,
    averageScore,
    totalTimeSpent,
    progressByType,
    progressByGrade,
    studyStreak
  };
}

// Helper function to calculate study streak
function calculateStudyStreak(progress: StudentProgress[]): { current: number; best: number; lastStudyDate: Date | null } {
  if (progress.length === 0) {
    return { current: 0, best: 0, lastStudyDate: null };
  }
  
  // Sort progress by completion date (newest first)
  const sortedDates = progress.map(p => new Date(p.completedAt))
    .sort((a, b) => b.getTime() - a.getTime());
  
  const lastStudyDate = sortedDates[0];
  const today = new Date();
  
  // Check if the last study date is today or yesterday
  const isToday = isSameDay(lastStudyDate, today);
  const isYesterday = isSameDay(lastStudyDate, new Date(today.setDate(today.getDate() - 1)));
  
  // If the last study wasn't today or yesterday, streak is broken
  if (!isToday && !isYesterday) {
    return { 
      current: 0, 
      best: calculateBestStreak(sortedDates),
      lastStudyDate 
    };
  }
  
  // Calculate current streak
  let currentStreak = 1; // Start with 1 for the most recent day
  let previousDate = lastStudyDate;
  
  for (let i = 1; i < sortedDates.length; i++) {
    const currentDate = sortedDates[i];
    
    // Check if this date is the previous day from our last counted date
    const expectedPreviousDay = new Date(previousDate);
    expectedPreviousDay.setDate(expectedPreviousDay.getDate() - 1);
    
    if (isSameDay(currentDate, expectedPreviousDay)) {
      currentStreak++;
      previousDate = currentDate;
    } else {
      // Streak is broken
      break;
    }
  }
  
  const bestStreak = Math.max(currentStreak, calculateBestStreak(sortedDates));
  
  return {
    current: currentStreak,
    best: bestStreak,
    lastStudyDate
  };
}

// Helper function to calculate the best streak
function calculateBestStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;
  
  let bestStreak = 1;
  let currentStreak = 1;
  
  for (let i = 1; i < dates.length; i++) {
    const currentDate = dates[i];
    const previousDate = dates[i - 1];
    
    // Check if this date is the previous day from our last counted date
    const expectedPreviousDay = new Date(previousDate);
    expectedPreviousDay.setDate(expectedPreviousDay.getDate() - 1);
    
    if (isSameDay(currentDate, expectedPreviousDay)) {
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      // Streak is broken
      currentStreak = 1;
    }
  }
  
  return bestStreak;
}

// Helper function to check if two dates are the same day
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// Helper function to format time
export function formatTimeSpent(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

  // Create the db object that your component expects
export const db = {
  // Student progress methods
  getStudentProgress,
  saveStudentProgress,
  getWorksheetProgress,
  
  // Worksheet methods
  saveWorksheet,
  getUserWorksheets,
  getWorksheetById,
  deleteWorksheet,
  
  // User role methods
  getUserRole,
  setUserRole,
  isStudent,
  
  // Analytics methods
  getUserAnalytics,
  getStudentAnalytics,
  
  // Helper methods
  formatTimeSpent
};