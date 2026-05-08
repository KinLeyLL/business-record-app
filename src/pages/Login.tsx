import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import type { Role } from '../types/auth';

interface LoginProps {
  onLogin: (role: Role) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const authUser = data.user ?? data.session?.user;
      if (!authUser) {
        throw new Error('Unable to authenticate with provided credentials.');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        console.warn('Failed to load profile role, defaulting to EMPLOYEE.', profileError.message);
      }

      const assignedRole = (profile?.role || 'EMPLOYEE') as Role;
      onLogin(assignedRole);
      navigate('/dashboard');
    } catch (error: any) {
      alert(error?.message ?? 'Login failed; check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-2xl border border-gray-100">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900">BizManager</h2>
          <p className="mt-2 text-sm text-slate-500">Sign in with your Supabase email and password.</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type="email"
                className="block w-full rounded-lg border border-slate-200 pl-10 pr-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type="password"
                className="block w-full rounded-lg border border-slate-200 pl-10 pr-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center rounded-lg bg-indigo-600 py-3 text-white font-bold hover:bg-indigo-700 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Sign in to Portal'}
          </button>
        </form>
      </div>
    </div>
  );
}