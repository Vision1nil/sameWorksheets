// Mock database for saved worksheets, student progress, and classroom management
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

export interface Classroom {
  id: string;
  teacherId: string;
  name: string;
  description: string;
  code: string; // Unique classroom code for students to join
  studentIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Assignment {
  id: string;
  classroomId: string;
  teacherId: string;
  worksheetId: string;
  title: string;
  description: string;
  dueDate: Date;
  assignedStudents: string[];
  submissions: AssignmentSubmission[];
  createdAt: Date;
}

export interface AssignmentSubmission {
  studentId: string;
  progressId: string;
  submittedAt: Date;
  status: 'submitted' | 'graded';
  grade?: number;
  feedback?: string;
}

export interface UserRole {
  userId: string;
  role: 'student' | 'teacher' | 'admin';
  metadata?: {
    gradeLevel?: string;
    subject?: string;
    school?: string;
  };
}

// Mock data storage (in memory)
const savedWorksheets: SavedWorksheet[] = [];
const studentProgress: StudentProgress[] = [];
const classrooms: Classroom[] = [];
const assignments: Assignment[] = [];
const userRoles: UserRole[] = [];

// User Role Management
export async function getUserRole(userId: string): Promise<UserRole | null> {
  return userRoles.find(role => role.userId === userId) || null;
}

export async function setUserRole(userId: string, role: 'student' | 'teacher' | 'admin', metadata?: UserRole['metadata']): Promise<UserRole> {
  const existingRole = userRoles.find(r => r.userId === userId);
  if (existingRole) {
    existingRole.role = role;
    existingRole.metadata = metadata;
    return existingRole;
  }
  const newRole: UserRole = { userId, role, metadata };
  userRoles.push(newRole);
  return newRole;
}

export async function isTeacher(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role?.role === 'teacher' || role?.role === 'admin';
}

export async function isStudent(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role?.role === 'student';
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
  if (worksheet.userId === userId || userRole?.role === 'teacher' || userRole?.role === 'admin') {
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
  const userRole = await getUserRole(userId);
  
  if (userRole?.role === 'teacher' || userRole?.role === 'admin') {
    // Teachers can see all progress for their worksheets
    return studentProgress.filter(progress => progress.worksheetId === worksheetId);
  }
  // Students can only see their own progress
  return studentProgress.filter(progress => 
    progress.worksheetId === worksheetId && progress.userId === userId
  );
}

// Classroom Management (Teacher Features)
export async function createClassroom(teacherId: string, name: string, description: string): Promise<Classroom | null> {
  if (!(await isTeacher(teacherId))) return null;
  
  const newClassroom: Classroom = {
    id: `classroom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    teacherId,
    name,
    description,
    code: Math.random().toString(36).substr(2, 8).toUpperCase(),
    studentIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  classrooms.push(newClassroom);
  return newClassroom;
}

export async function getTeacherClassrooms(teacherId: string): Promise<Classroom[]> {
  if (!(await isTeacher(teacherId))) return [];
  return classrooms.filter(classroom => classroom.teacherId === teacherId);
}

export async function getStudentClassrooms(studentId: string): Promise<Classroom[]> {
  return classrooms.filter(classroom => classroom.studentIds.includes(studentId));
}

export async function joinClassroom(studentId: string, classroomCode: string): Promise<boolean> {
  const classroom = classrooms.find(c => c.code === classroomCode);
  if (!classroom) return false;
  
  if (!classroom.studentIds.includes(studentId)) {
    classroom.studentIds.push(studentId);
    classroom.updatedAt = new Date();
  }
  
  return true;
}

// Assignment Management (Teacher Features)
export async function createAssignment(assignment: Omit<Assignment, 'id' | 'createdAt' | 'submissions'>): Promise<Assignment | null> {
  if (!(await isTeacher(assignment.teacherId))) return null;
  
  const newAssignment: Assignment = {
    ...assignment,
    id: `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    submissions: [],
    createdAt: new Date(),
  };
  
  assignments.push(newAssignment);
  return newAssignment;
}

export async function getClassroomAssignments(classroomId: string, userId: string): Promise<Assignment[]> {
  const userRole = await getUserRole(userId);
  const classroom = classrooms.find(c => c.id === classroomId);
  
  if (!classroom) return [];
  
  // Check if user has access to this classroom
  if (classroom.teacherId === userId || 
      classroom.studentIds.includes(userId) ||
      userRole?.role === 'admin') {
    return assignments.filter(assignment => assignment.classroomId === classroomId);
  }
  
  return [];
}

export async function submitAssignment(assignmentId: string, studentId: string, progressId: string): Promise<boolean> {
  const assignment = assignments.find(a => a.id === assignmentId);
  if (!assignment) return false;
  
  const existingSubmission = assignment.submissions.find(s => s.studentId === studentId);
  if (existingSubmission) {
    // Update existing submission
    existingSubmission.progressId = progressId;
    existingSubmission.submittedAt = new Date();
    existingSubmission.status = 'submitted';
  } else {
    // Create new submission
    assignment.submissions.push({
      studentId,
      progressId,
      submittedAt: new Date(),
      status: 'submitted',
    });
  }
  
  return true;
}

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
// Add this to the end of your src/lib/database.ts file

// Helper function to format time
export function formatTimeSpent(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// Student Analytics Interface (add this interface)
export interface StudentAnalytics {
  totalWorksheets: number;
  averageScore: number;
  totalTimeSpent: number;
  progressByType: Record<string, { completed: number; averageScore: number }>;
  progressByGrade: Record<string, { completed: number; averageScore: number }>;
}

// Create analytics function for students
export async function getStudentAnalytics(studentId: string): Promise<StudentAnalytics> {
  const progress = await getStudentProgress(studentId);
  const userWorksheets = await getUserWorksheets(studentId);
  
  const totalWorksheets = progress.length;
  const averageScore = totalWorksheets > 0 
    ? progress.reduce((sum, p) => sum + (p.score / p.totalQuestions * 100), 0) / totalWorksheets
    : 0;
  const totalTimeSpent = progress.reduce((sum, p) => sum + p.timeSpent, 0);
  
  // Group by worksheet type
  const progressByType: Record<string, { completed: number; averageScore: number }> = {};
  const progressByGrade: Record<string, { completed: number; averageScore: number }> = {};
  
  for (const prog of progress) {
    const worksheet = userWorksheets.find(w => w.id === prog.worksheetId);
    if (worksheet) {
      // By type
      const type = worksheet.type;
      if (!progressByType[type]) {
        progressByType[type] = { completed: 0, averageScore: 0 };
      }
      progressByType[type].completed++;
      progressByType[type].averageScore += prog.score / prog.totalQuestions * 100;
      
      // By grade
      const grade = worksheet.grade;
      if (!progressByGrade[grade]) {
        progressByGrade[grade] = { completed: 0, averageScore: 0 };
      }
      progressByGrade[grade].completed++;
      progressByGrade[grade].averageScore += prog.score / prog.totalQuestions * 100;
    }
  }
  
  // Calculate averages
  Object.values(progressByType).forEach(data => {
    if (data.completed > 0) {
      data.averageScore = data.averageScore / data.completed;
    }
  });
  
  Object.values(progressByGrade).forEach(data => {
    if (data.completed > 0) {
      data.averageScore = data.averageScore / data.completed;
    }
  });
  
  return {
    totalWorksheets,
    averageScore,
    totalTimeSpent,
    progressByType,
    progressByGrade
  };
}

// Get student assignments
export async function getStudentAssignments(studentId: string): Promise<Assignment[]> {
  const studentClassrooms = await getStudentClassrooms(studentId);
  const studentAssignments: Assignment[] = [];
  
  for (const classroom of studentClassrooms) {
    const classroomAssignments = await getClassroomAssignments(classroom.id, studentId);
    studentAssignments.push(...classroomAssignments);
  }
  
  return studentAssignments;
}

// Create the db object that your component expects
export const db = {
  // Student progress methods
  getStudentProgress,
  getStudentAnalytics,
  getStudentAssignments,
  
  // Worksheet methods
  saveWorksheet,
  getUserWorksheets,
  getWorksheetById,
  deleteWorksheet,
  
  // Progress methods
  saveStudentProgress,
  getWorksheetProgress,
  
  // Classroom methods
  createClassroom,
  getTeacherClassrooms,
  getStudentClassrooms,
  joinClassroom,
  
  // Assignment methods
  createAssignment,
  getClassroomAssignments,
  submitAssignment,
  
  // User role methods
  getUserRole,
  setUserRole,
  isTeacher,
  isStudent,
  
  // Analytics
  getUserAnalytics
};