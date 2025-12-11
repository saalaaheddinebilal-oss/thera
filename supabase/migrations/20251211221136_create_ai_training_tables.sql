/*
  # AI Model Training Management Tables

  1. New Tables
    - `training_datasets` - Stores dataset metadata
    - `training_configurations` - Stores training job configurations
    - `training_jobs` - Tracks training job history
    - `model_versions` - Stores trained model metadata
    - `training_metrics` - Real-time metrics during training

  2. Security
    - Enable RLS on all tables
    - Only system_admin users can access
*/

CREATE TABLE IF NOT EXISTS training_datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  file_path text NOT NULL,
  uploaded_by uuid REFERENCES profiles(id),
  row_count integer,
  column_count integer,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS training_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  dataset_id uuid REFERENCES training_datasets(id),
  model_type text NOT NULL,
  target_column text NOT NULL,
  feature_columns text[] NOT NULL,
  train_test_split numeric DEFAULT 0.8,
  hyperparameters jsonb DEFAULT '{}',
  preprocessing_options jsonb DEFAULT '{}',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS training_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_id uuid REFERENCES training_configurations(id),
  status text DEFAULT 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  total_epochs integer DEFAULT 100,
  current_epoch integer DEFAULT 0,
  current_batch integer DEFAULT 0,
  total_batches integer DEFAULT 0,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS model_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_job_id uuid REFERENCES training_jobs(id),
  model_type text NOT NULL,
  version_number integer NOT NULL,
  model_path text NOT NULL,
  is_active boolean DEFAULT false,
  accuracy numeric,
  precision numeric,
  recall numeric,
  f1_score numeric,
  auc_score numeric,
  confusion_matrix jsonb,
  feature_importance jsonb,
  training_time_seconds integer,
  cross_val_scores jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS training_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_job_id uuid REFERENCES training_jobs(id),
  epoch integer NOT NULL,
  batch integer NOT NULL,
  accuracy numeric,
  loss numeric,
  precision numeric,
  recall numeric,
  f1_score numeric,
  validation_accuracy numeric,
  validation_loss numeric,
  timestamp timestamptz DEFAULT now()
);

ALTER TABLE training_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System admins can view all datasets"
  ON training_datasets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'system_admin'
    )
  );

CREATE POLICY "System admins can create datasets"
  ON training_datasets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'system_admin'
    )
  );

CREATE POLICY "System admins can view all configurations"
  ON training_configurations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'system_admin'
    )
  );

CREATE POLICY "System admins can create configurations"
  ON training_configurations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'system_admin'
    )
  );

CREATE POLICY "System admins can view all training jobs"
  ON training_jobs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'system_admin'
    )
  );

CREATE POLICY "System admins can create training jobs"
  ON training_jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'system_admin'
    )
  );

CREATE POLICY "System admins can update training jobs"
  ON training_jobs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'system_admin'
    )
  );

CREATE POLICY "System admins can view all model versions"
  ON model_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('system_admin', 'school_admin')
    )
  );

CREATE POLICY "System admins can create model versions"
  ON model_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'system_admin'
    )
  );

CREATE POLICY "System admins can update model versions"
  ON model_versions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'system_admin'
    )
  );

CREATE POLICY "System admins can view all metrics"
  ON training_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'system_admin'
    )
  );

CREATE POLICY "System admins can insert metrics"
  ON training_metrics FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'system_admin'
    )
  );
