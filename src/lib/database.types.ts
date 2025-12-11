export type UserRole = 'parent' | 'therapist' | 'school_admin' | 'system_admin';
export type ConditionType = 'autism' | 'adhd' | 'speech_delay' | 'learning_disability' | 'behavioral_issues' | 'other';
export type TherapyArea = 'academic' | 'emotional' | 'linguistic' | 'sensory' | 'behavioral' | 'life_skills';
export type SessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
export type AnalysisType = 'speech' | 'behavior' | 'emotion' | 'progress_prediction' | 'risk_detection' | 'pattern_recognition';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      students: {
        Row: {
          id: string;
          full_name: string;
          date_of_birth: string;
          gender: string | null;
          parent_id: string;
          primary_therapist_id: string | null;
          avatar_url: string | null;
          emergency_contact: string | null;
          medical_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['students']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['students']['Insert']>;
      };
      therapy_sessions: {
        Row: {
          id: string;
          student_id: string;
          therapist_id: string;
          session_date: string;
          duration_minutes: number | null;
          focus_area: TherapyArea | null;
          status: SessionStatus;
          video_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['therapy_sessions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['therapy_sessions']['Insert']>;
      };
      progress_tracking: {
        Row: {
          id: string;
          student_id: string;
          tracking_date: string;
          focus_area: TherapyArea;
          metric_name: string;
          metric_value: number | null;
          notes: string | null;
          recorded_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['progress_tracking']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['progress_tracking']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          student_id: string | null;
          subject: string | null;
          content: string;
          read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
      recommendations: {
        Row: {
          id: string;
          student_id: string;
          generated_by: string;
          recommendation_type: string;
          title: string;
          description: string | null;
          priority: string;
          status: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['recommendations']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['recommendations']['Insert']>;
      };
    };
  };
}
