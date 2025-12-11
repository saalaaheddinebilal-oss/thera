import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authAPI, Profile } from '../lib/api';
import { UserRole } from '../lib/database.types';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const profileData = await authAPI.getProfile();
        setProfile(profileData);
        setUser({
          id: profileData.id,
          email: profileData.email,
          fullName: profileData.full_name,
          role: profileData.role,
        });
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('auth_token');
      }
    }
    setLoading(false);
  }

  async function signIn(email: string, password: string) {
    try {
      const data = await authAPI.signIn({ email, password });
      setUser(data.user);

      const profileData = await authAPI.getProfile();
      setProfile(profileData);

      return { error: null };
    } catch (error: any) {
      return { error: new Error(error.response?.data?.error || 'Sign in failed') };
    }
  }

  async function signUp(email: string, password: string, fullName: string, role: UserRole) {
    try {
      const data = await authAPI.signUp({ email, password, fullName, role });
      setUser(data.user);

      const profileData = await authAPI.getProfile();
      setProfile(profileData);

      return { error: null };
    } catch (error: any) {
      return { error: new Error(error.response?.data?.error || 'Sign up failed') };
    }
  }

  async function signOut() {
    authAPI.signOut();
    setUser(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
