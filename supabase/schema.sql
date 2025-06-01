-- Supabase Schema for Interactive AI Worksheet Educational App
-- This file contains the SQL schema definitions for the database tables

-- Enable Row Level Security (RLS) for all tables
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret-here';

-- Create schema for public tables
CREATE SCHEMA IF NOT EXISTS public;

-- Enable RLS on the schema
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create worksheets table
CREATE TABLE IF NOT EXISTS public.worksheets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  grade TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('grammar', 'vocabulary', 'readingComprehension')),
  topics JSONB NOT NULL DEFAULT '[]'::JSONB,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  questions JSONB NOT NULL DEFAULT '[]'::JSONB,
  settings JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create student_progress table
CREATE TABLE IF NOT EXISTS public.student_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  worksheet_id UUID NOT NULL REFERENCES public.worksheets(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  time_spent INTEGER NOT NULL DEFAULT 0, -- in seconds
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  answers JSONB NOT NULL DEFAULT '[]'::JSONB
);

-- Create classrooms table
CREATE TABLE IF NOT EXISTS public.classrooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  code TEXT UNIQUE NOT NULL,
  student_ids JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  worksheet_id UUID NOT NULL REFERENCES public.worksheets(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  assigned_students JSONB NOT NULL DEFAULT '[]'::JSONB,
  submissions JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics_cache table for storing pre-computed analytics
CREATE TABLE IF NOT EXISTS public.analytics_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cache_type TEXT NOT NULL, -- e.g., 'student_performance', 'teacher_overview'
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, cache_type)
);

-- Create Row Level Security (RLS) policies
-- Worksheets policies
ALTER TABLE public.worksheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own worksheets" 
  ON public.worksheets FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view all worksheets" 
  ON public.worksheets FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('teacher', 'admin')
  ));

CREATE POLICY "Users can insert their own worksheets" 
  ON public.worksheets FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own worksheets" 
  ON public.worksheets FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own worksheets" 
  ON public.worksheets FOR DELETE 
  USING (auth.uid() = user_id);

-- Student progress policies
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own progress" 
  ON public.student_progress FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view all student progress" 
  ON public.student_progress FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('teacher', 'admin')
  ));

CREATE POLICY "Students can insert their own progress" 
  ON public.student_progress FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update their own progress" 
  ON public.student_progress FOR UPDATE 
  USING (auth.uid() = user_id);

-- Classrooms policies
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage their own classrooms" 
  ON public.classrooms FOR ALL 
  USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view classrooms they belong to" 
  ON public.classrooms FOR SELECT 
  USING (auth.uid()::TEXT IN (
    SELECT jsonb_array_elements_text(student_ids) FROM public.classrooms
  ));

-- Assignments policies
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage their own assignments" 
  ON public.assignments FOR ALL 
  USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view assignments assigned to them" 
  ON public.assignments FOR SELECT 
  USING (auth.uid()::TEXT IN (
    SELECT jsonb_array_elements_text(assigned_students) FROM public.assignments
  ));

-- Analytics cache policies
ALTER TABLE public.analytics_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analytics" 
  ON public.analytics_cache FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view analytics for their students" 
  ON public.analytics_cache FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    ) AND
    EXISTS (
      SELECT 1 FROM public.classrooms c
      WHERE c.teacher_id = auth.uid() AND user_id::TEXT IN (
        SELECT jsonb_array_elements_text(c.student_ids)
      )
    )
  );

-- Create functions for real-time updates
-- Function to update worksheet stats when progress is recorded
CREATE OR REPLACE FUNCTION public.update_worksheet_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update analytics cache for the student
  INSERT INTO public.analytics_cache (user_id, cache_type, data)
  VALUES (
    NEW.user_id, 
    'student_performance', 
    (
      SELECT json_build_object(
        'totalWorksheets', COUNT(DISTINCT worksheet_id),
        'averageScore', AVG(score),
        'totalTimeSpent', SUM(time_spent),
        'lastUpdated', NOW()
      )
      FROM public.student_progress
      WHERE user_id = NEW.user_id
    )
  )
  ON CONFLICT (user_id, cache_type) 
  DO UPDATE SET 
    data = (
      SELECT json_build_object(
        'totalWorksheets', COUNT(DISTINCT worksheet_id),
        'averageScore', AVG(score),
        'totalTimeSpent', SUM(time_spent),
        'lastUpdated', NOW()
      )
      FROM public.student_progress
      WHERE user_id = NEW.user_id
    ),
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for student progress updates
CREATE TRIGGER on_student_progress_update
  AFTER INSERT OR UPDATE ON public.student_progress
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_worksheet_stats();

-- Function to update teacher analytics when student progress is recorded
CREATE OR REPLACE FUNCTION public.update_teacher_analytics()
RETURNS TRIGGER AS $$
DECLARE
  teacher_ids UUID[];
BEGIN
  -- Find all teachers who have this student in their classrooms
  SELECT ARRAY_AGG(DISTINCT teacher_id) INTO teacher_ids
  FROM public.classrooms
  WHERE NEW.user_id::TEXT IN (
    SELECT jsonb_array_elements_text(student_ids)
  );
  
  -- Update analytics cache for each teacher
  IF array_length(teacher_ids, 1) > 0 THEN
    FOR i IN 1..array_length(teacher_ids, 1) LOOP
      INSERT INTO public.analytics_cache (user_id, cache_type, data)
      VALUES (
        teacher_ids[i], 
        'teacher_overview', 
        (
          SELECT json_build_object(
            'totalStudents', (
              SELECT COUNT(DISTINCT jsonb_array_elements_text(student_ids))
              FROM public.classrooms
              WHERE teacher_id = teacher_ids[i]
            ),
            'averageClassScore', (
              SELECT AVG(sp.score)
              FROM public.student_progress sp
              JOIN public.classrooms c ON sp.user_id::TEXT IN (
                SELECT jsonb_array_elements_text(c.student_ids)
              )
              WHERE c.teacher_id = teacher_ids[i]
            ),
            'lastUpdated', NOW()
          )
        )
      )
      ON CONFLICT (user_id, cache_type) 
      DO UPDATE SET 
        data = (
          SELECT json_build_object(
            'totalStudents', (
              SELECT COUNT(DISTINCT jsonb_array_elements_text(student_ids))
              FROM public.classrooms
              WHERE teacher_id = teacher_ids[i]
            ),
            'averageClassScore', (
              SELECT AVG(sp.score)
              FROM public.student_progress sp
              JOIN public.classrooms c ON sp.user_id::TEXT IN (
                SELECT jsonb_array_elements_text(c.student_ids)
              )
              WHERE c.teacher_id = teacher_ids[i]
            ),
            'lastUpdated', NOW()
          )
        ),
        updated_at = NOW();
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for teacher analytics updates
CREATE TRIGGER on_student_progress_update_teacher
  AFTER INSERT OR UPDATE ON public.student_progress
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_teacher_analytics();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_worksheets_user_id ON public.worksheets(user_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_user_id ON public.student_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_worksheet_id ON public.student_progress(worksheet_id);
CREATE INDEX IF NOT EXISTS idx_classrooms_teacher_id ON public.classrooms(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_classroom_id ON public.assignments(classroom_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_id ON public.assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_user_id ON public.analytics_cache(user_id);
