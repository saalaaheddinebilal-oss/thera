import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { studentsAPI, sessionsAPI } from '../../lib/api';
import { Users, Calendar, FileText, Brain, TrendingUp, Clock } from 'lucide-react';

interface DashboardStats {
  totalStudents: number;
  todaySessions: number;
  pendingAssessments: number;
  activeIEPs: number;
}

export function TherapistDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    todaySessions: 0,
    pendingAssessments: 0,
    activeIEPs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  async function loadDashboardData() {
    if (!user) return;

    try {
      const [students, sessions] = await Promise.all([
        studentsAPI.getAll(),
        sessionsAPI.getAll(),
      ]);

      const today = new Date().toISOString().split('T')[0];
      const todaySessions = sessions.filter((s: any) =>
        s.session_date.startsWith(today)
      );

      setStats({
        totalStudents: students.length || 0,
        todaySessions: todaySessions.length || 0,
        pendingAssessments: 0,
        activeIEPs: 0,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Therapist Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your students and track their therapeutic progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Users}
          label="Total Students"
          value={stats.totalStudents.toString()}
          color="bg-blue-500"
        />
        <StatCard
          icon={Calendar}
          label="Today's Sessions"
          value={stats.todaySessions.toString()}
          color="bg-green-500"
        />
        <StatCard
          icon={FileText}
          label="Pending Assessments"
          value={stats.pendingAssessments.toString()}
          color="bg-orange-500"
        />
        <StatCard
          icon={Brain}
          label="Active IEPs"
          value={stats.activeIEPs.toString()}
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Today's Schedule
          </h3>
          <div className="space-y-3">
            <div className="text-center py-8 text-gray-500">
              No sessions scheduled for today
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Recent Progress
          </h3>
          <div className="space-y-3">
            <div className="text-center py-8 text-gray-500">
              No recent progress updates
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-gray-600 text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
