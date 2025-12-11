/*
  # Create Core Application Tables

  1. New Tables
    - `profiles` - User profiles and roles
    - `students` - Student information
    - `therapy_sessions` - Therapy session records
    - `progress_tracking` - Student progress metrics
    - `messages` - User messaging
    - `recommendations` - AI-generated recommendations
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'parent',
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  date_of_birth text NOT NULL,
  gender text,
  parent_id uuid REFERENCES profiles(id),
  primary_therapist_id uuid REFERENCES profiles(id),
  avatar_url text,
  emergency_contact text,
  medical_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS therapy_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id),
  therapist_id uuid REFERENCES profiles(id),
  session_date text NOT NULL,
  duration_minutes integer,
  focus_area text,
  status text DEFAULT 'scheduled',
  video_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS progress_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id),
  tracking_date text NOT NULL,
  focus_area text NOT NULL,
  metric_name text NOT NULL,
  metric_value numeric,
  notes text,
  recorded_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id),
  recipient_id uuid REFERENCES profiles(id),
  student_id uuid REFERENCES students(id),
  subject text,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id),
  generated_by uuid REFERENCES profiles(id),
  recommendation_type text NOT NULL,
  title text NOT NULL,
  description text,
  priority text,
  status text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Parents can view their children"
  ON students FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('therapist', 'school_admin', 'system_admin')
  ));

CREATE POLICY "Therapists can view assigned students"
  ON students FOR SELECT
  TO authenticated
  USING (primary_therapist_id = auth.uid() OR parent_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('school_admin', 'system_admin')
  ));

CREATE POLICY "Authorized users can view sessions"
  ON therapy_sessions FOR SELECT
  TO authenticated
  USING (therapist_id = auth.uid() OR student_id IN (
    SELECT id FROM students WHERE parent_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('school_admin', 'system_admin')
  ));

CREATE POLICY "Authorized users can view progress"
  ON progress_tracking FOR SELECT
  TO authenticated
  USING (student_id IN (
    SELECT id FROM students WHERE parent_id = auth.uid() OR primary_therapist_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('school_admin', 'system_admin')
  ));

CREATE POLICY "Users can read their messages"
  ON messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can view recommendations for their students"
  ON recommendations FOR SELECT
  TO authenticated
  USING (student_id IN (
    SELECT id FROM students WHERE parent_id = auth.uid() OR primary_therapist_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('school_admin', 'system_admin')
  ));
