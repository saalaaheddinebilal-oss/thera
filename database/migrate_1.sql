-- Migration for AI Training Tables
BEGIN;

-- 1. Create AI training tables
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

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_training_jobs_status ON training_jobs(status);
CREATE INDEX IF NOT EXISTS idx_model_versions_active ON model_versions(is_active);
CREATE INDEX IF NOT EXISTS idx_training_metrics_job ON training_metrics(training_job_id);

COMMIT;
