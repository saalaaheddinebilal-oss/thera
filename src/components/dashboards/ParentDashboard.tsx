import { useEffect, useState } from 'react';
import { studentsAPI } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { TrendingUp, Calendar, MessageSquare, Activity, Target, AlertCircle } from 'lucide-react';

interface Student {
  id: string;
  full_name: string;
  date_of_birth: string;
  avatar_url: string | null;
}

export function ParentDashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, [user]);

  async function loadStudents() {
    if (!user) return;

    try {
      const data = await studentsAPI.getAll();
      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
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
        <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
        <p className="text-gray-600 mt-2">Track your child's progress and stay connected with their care team</p>
      </div>

      {students.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No children added yet</h3>
          <p className="text-gray-600 mb-4">Contact your therapist to add your child to the platform</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              icon={TrendingUp}
              label="Overall Progress"
              value="75%"
              trend="+12%"
              color="blue"
            />
            <StatCard
              icon={Calendar}
              label="Upcoming Sessions"
              value="3"
              trend="This week"
              color="green"
            />
            <StatCard
              icon={Target}
              label="Active Goals"
              value="8"
              trend="2 completed"
              color="purple"
            />
            <StatCard
              icon={MessageSquare}
              label="New Messages"
              value="2"
              trend="From therapist"
              color="orange"
            />
          </div>

          {students.map((student) => (
            <div key={student.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {student.full_name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{student.full_name}</h2>
                  <p className="text-gray-600">
                    Age: {new Date().getFullYear() - new Date(student.date_of_birth).getFullYear()} years
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <Activity className="w-6 h-6 text-blue-600 mb-2" />
                  <h3 className="font-semibold text-gray-900 mb-1">Daily Activities</h3>
                  <p className="text-sm text-gray-600">5 activities completed today</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <Target className="w-6 h-6 text-green-600 mb-2" />
                  <h3 className="font-semibold text-gray-900 mb-1">Active Goals</h3>
                  <p className="text-sm text-gray-600">3 goals in progress</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <TrendingUp className="w-6 h-6 text-purple-600 mb-2" />
                  <h3 className="font-semibold text-gray-900 mb-1">This Week</h3>
                  <p className="text-sm text-gray-600">Excellent progress</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  trend: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function StatCard({ icon: Icon, label, value, trend, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-gray-600 text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-500">{trend}</p>
    </div>
  );
}
