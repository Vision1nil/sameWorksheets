// Supabase Migration Script
// This script helps with setting up the Supabase database and migrating data

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin operations

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or Service Role Key is missing.');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Function to run SQL file
async function runSqlFile(filePath) {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Split the SQL file into individual statements
    const statements = sql
      .split(';')
      .filter(statement => statement.trim() !== '')
      .map(statement => statement.trim() + ';');
    
    console.log(`Executing ${statements.length} SQL statements from ${filePath}`);
    
    // Execute each statement
    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.warn(`Warning executing statement: ${error.message}`);
          console.warn('Statement:', statement);
        }
      } catch (err) {
        console.warn(`Warning: ${err.message}`);
      }
    }
    
    console.log(`Completed executing SQL from ${filePath}`);
  } catch (error) {
    console.error(`Error running SQL file ${filePath}:`, error);
    throw error;
  }
}

// Function to migrate mock data to Supabase
async function migrateMockData() {
  try {
    console.log('Starting mock data migration...');
    
    // Import mock data
    const { db } = require('../src/lib/database');
    
    // Migrate users
    console.log('Migrating users...');
    const users = [
      { id: '1', username: 'teacher1', full_name: 'Teacher One', role: 'teacher', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher1' },
      { id: '2', username: 'student1', full_name: 'Student One', role: 'student', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student1' },
      { id: '3', username: 'student2', full_name: 'Student Two', role: 'student', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student2' }
    ];
    
    for (const user of users) {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          role: user.role,
          avatar_url: user.avatar_url
        });
      
      if (error) console.warn(`Warning inserting user ${user.username}:`, error.message);
    }
    
    // Migrate worksheets
    console.log('Migrating worksheets...');
    const worksheets = await db.getWorksheets();
    
    for (const worksheet of worksheets) {
      const { data, error } = await supabase
        .from('worksheets')
        .upsert({
          id: worksheet.id,
          user_id: worksheet.userId,
          title: worksheet.title,
          grade: worksheet.grade,
          type: worksheet.type,
          topics: worksheet.topics,
          difficulty: worksheet.difficulty,
          questions: worksheet.questions,
          settings: worksheet.settings,
          created_at: worksheet.createdAt,
          updated_at: worksheet.updatedAt
        });
      
      if (error) console.warn(`Warning inserting worksheet ${worksheet.id}:`, error.message);
    }
    
    // Migrate student progress
    console.log('Migrating student progress...');
    const allProgress = await db.getAllStudentProgress();
    
    for (const progress of allProgress) {
      const { data, error } = await supabase
        .from('student_progress')
        .upsert({
          id: progress.id,
          user_id: progress.userId,
          worksheet_id: progress.worksheetId,
          score: progress.score,
          total_questions: progress.totalQuestions,
          time_spent: progress.timeSpent,
          completed_at: progress.completedAt,
          answers: progress.answers
        });
      
      if (error) console.warn(`Warning inserting progress ${progress.id}:`, error.message);
    }
    
    // Migrate classrooms
    console.log('Migrating classrooms...');
    const classrooms = await db.getClassrooms();
    
    for (const classroom of classrooms) {
      const { data, error } = await supabase
        .from('classrooms')
        .upsert({
          id: classroom.id,
          teacher_id: classroom.teacherId,
          name: classroom.name,
          description: classroom.description,
          code: classroom.code,
          student_ids: classroom.studentIds,
          created_at: classroom.createdAt,
          updated_at: classroom.updatedAt
        });
      
      if (error) console.warn(`Warning inserting classroom ${classroom.id}:`, error.message);
    }
    
    // Migrate assignments
    console.log('Migrating assignments...');
    const assignments = await db.getAssignments();
    
    for (const assignment of assignments) {
      const { data, error } = await supabase
        .from('assignments')
        .upsert({
          id: assignment.id,
          classroom_id: assignment.classroomId,
          teacher_id: assignment.teacherId,
          worksheet_id: assignment.worksheetId,
          title: assignment.title,
          description: assignment.description,
          due_date: assignment.dueDate,
          assigned_students: assignment.assignedStudents,
          submissions: assignment.submissions,
          created_at: assignment.createdAt
        });
      
      if (error) console.warn(`Warning inserting assignment ${assignment.id}:`, error.message);
    }
    
    console.log('Mock data migration completed successfully!');
  } catch (error) {
    console.error('Error migrating mock data:', error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    console.log('Starting Supabase migration...');
    
    // Run schema SQL file
    const schemaPath = path.join(__dirname, 'schema.sql');
    await runSqlFile(schemaPath);
    
    // Migrate mock data
    await migrateMockData();
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
main();
