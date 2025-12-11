-- Educational Therapy Platform Database Schema
-- PostgreSQL 14+ required

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User roles enum
CREATE TYPE user_role AS ENUM ('parent', 'therapist', 'school_admin', 'system_admin');

-- Student condition types
CREATE TYPE condition_type AS ENUM ('autism', 'adhd', 'speech_delay', 'learning_disability', 'behavioral_issues', 'other');

-- Therapy focus areas
CREATE TYPE therapy_area AS ENUM ('academic', 'emotional', 'linguistic', 'sensory', 'behavioral', 'life_skills');

-- Session status
CREATE TYPE session_status AS ENUM ('scheduled', 'completed', 'cancelled', 'rescheduled');

-- AI analysis types
CREATE TYPE analysis_type AS ENUM (
  'speech',
  'behavior',
  'emotion',
  'progress_prediction',
  'risk_detection',
  'pattern_recognition',
  'adaptive_learning',
  'auto_iep'
);

-- Users table (replaces auth.users from Supabase)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  email_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Profiles table (extends users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role user_role NOT NULL,
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Schools table
CREATE TABLE IF NOT EXISTS schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  phone text,
  email text,
  admin_id uuid REFERENCES profiles(id),
  license_type text,
  license_expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- School staff table
CREATE TABLE IF NOT EXISTS school_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  position text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(school_id, user_id)
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  date_of_birth date NOT NULL,
  gender text,
  parent_id uuid REFERENCES profiles(id) NOT NULL,
  primary_therapist_id uuid REFERENCES profiles(id),
  avatar_url text,
  emergency_contact text,
  medical_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Student conditions table
CREATE TABLE IF NOT EXISTS student_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  condition_type condition_type NOT NULL,
  severity text,
  diagnosed_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Student school enrollment
CREATE TABLE IF NOT EXISTS student_school_enrollment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  class_name text,
  grade_level text,
  enrollment_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Assessments table
CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  therapist_id uuid REFERENCES profiles(id) NOT NULL,
  assessment_type text NOT NULL,
  assessment_date date DEFAULT CURRENT_DATE,
  results jsonb,
  recommendations text,
  created_at timestamptz DEFAULT now()
);

-- IEP Plans table
CREATE TABLE IF NOT EXISTS iep_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES profiles(id) NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  goals jsonb NOT NULL,
  accommodations jsonb,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Annual therapy plans
CREATE TABLE IF NOT EXISTS annual_therapy_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  therapist_id uuid REFERENCES profiles(id) NOT NULL,
  year integer NOT NULL,
  focus_area therapy_area NOT NULL,
  monthly_goals jsonb NOT NULL,
  assessment_schedule jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Daily programs
CREATE TABLE IF NOT EXISTS daily_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  program_date date NOT NULL,
  morning_activities jsonb,
  midday_activities jsonb,
  evening_activities jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, program_date)
);

-- Therapy sessions
CREATE TABLE IF NOT EXISTS therapy_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  therapist_id uuid REFERENCES profiles(id) NOT NULL,
  session_date timestamptz NOT NULL,
  duration_minutes integer,
  focus_area therapy_area,
  status session_status DEFAULT 'scheduled',
  video_url text,
  created_at timestamptz DEFAULT now()
);

-- Session notes
CREATE TABLE IF NOT EXISTS session_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES therapy_sessions(id) ON DELETE CASCADE NOT NULL,
  therapist_id uuid REFERENCES profiles(id) NOT NULL,
  observations text,
  activities_completed jsonb,
  progress_notes text,
  next_steps text,
  created_at timestamptz DEFAULT now()
);

-- Progress tracking
CREATE TABLE IF NOT EXISTS progress_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  tracking_date date DEFAULT CURRENT_DATE,
  focus_area therapy_area NOT NULL,
  metric_name text NOT NULL,
  metric_value numeric,
  notes text,
  recorded_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- AI analysis results
CREATE TABLE IF NOT EXISTS ai_analysis_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  session_id uuid REFERENCES therapy_sessions(id),
  analysis_type analysis_type NOT NULL,
  analysis_date timestamptz DEFAULT now(),
  input_data jsonb,
  results jsonb NOT NULL,
  confidence_score numeric,
  created_at timestamptz DEFAULT now()
);

-- Recommendations
CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  generated_by text DEFAULT 'ai',
  recommendation_type text NOT NULL,
  title text NOT NULL,
  description text,
  priority text DEFAULT 'medium',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) NOT NULL,
  recipient_id uuid REFERENCES profiles(id) NOT NULL,
  student_id uuid REFERENCES students(id),
  subject text,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES profiles(id) NOT NULL,
  report_type text NOT NULL,
  title text NOT NULL,
  content jsonb NOT NULL,
  file_url text,
  shared_with uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_students_parent ON students(parent_id);
CREATE INDEX IF NOT EXISTS idx_students_therapist ON students(primary_therapist_id);
CREATE INDEX IF NOT EXISTS idx_sessions_student ON therapy_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_therapist ON therapy_sessions(therapist_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON therapy_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_progress_student ON progress_tracking(student_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_ai_results_student ON ai_analysis_results(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_results_type ON ai_analysis_results(analysis_type);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_iep_plans_updated_at BEFORE UPDATE ON iep_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_annual_therapy_plans_updated_at BEFORE UPDATE ON annual_therapy_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
