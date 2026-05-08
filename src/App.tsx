import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import type { Role } from './types/auth';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Projects from './pages/Projects';
import DSA from './pages/DSA';
import Finance from './pages/finance';
import Attendance from './pages/Attendance';
import Lumpsum from './pages/lumpsum';
import CompletedSites from './pages/CompletedSites';
import DocumentManager from './pages/DocumentManager';
import MainLayout from './components/MainLayout';

function App() {
  const [user, setUser] = useState<{ role: Role } | null>(null);
  const [loading, setLoading] = useState(true);

  const adminRoles: Role[] = ['ADMIN', 'MANAGER', 'OWNER'];

  const fetchUserRole = async (userId: string | null) => {
    if (!userId) {
      setUser(null);
      return;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('Unable to load profile role, defaulting to EMPLOYEE.', error.message);
    }

    const role = (profile?.role || 'EMPLOYEE') as Role;
    setUser({ role });
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();
      const userId = data?.session?.user?.id ?? null;
      await fetchUserRole(userId);
      setLoading(false);
    };

    initAuth();

    const subscription = supabase.auth.onAuthStateChange(async (_event, session) => {
      const userId = session?.user?.id ?? null;
      await fetchUserRole(userId);
      setLoading(false);
    });

    return () => {
      subscription.data?.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = (role: Role) => setUser({ role });
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading authentication...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* 1. LOGIN PAGE */}
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />}
        />

        {/* 2. DEFAULT DASHBOARD - THIS IS WHERE YOU LAND AFTER LOGIN */}
        <Route 
          path="/dashboard" 
          element={
            user ? (
              <MainLayout userRole={user.role} onLogout={handleLogout}>
                <Dashboard userRole={user.role} /> 
              </MainLayout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        {/* 3. DOCUMENT REGISTRY (NEW PAGE) */}
        <Route 
          path="/documents" 
          element={
            user ? (
              <MainLayout userRole={user.role} onLogout={handleLogout}>
                <DocumentManager userRole={user.role} /> 
              </MainLayout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        {/* 4. ALL OTHER EXISTING ROUTES */}
        <Route 
          path="/completed-sites" 
          element={
            user ? (
              <MainLayout userRole={user.role} onLogout={handleLogout}>
                <CompletedSites userRole={user.role} /> 
              </MainLayout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        <Route 
          path="/projects" 
          element={
            user && adminRoles.includes(user.role) ? (
              <MainLayout userRole={user.role} onLogout={handleLogout}>
                <Projects />
              </MainLayout>
            ) : (
              <Navigate to="/dashboard" />
            )
          } 
        />

        <Route 
           path="/dsa" 
           element={
             user ? (
               <MainLayout userRole={user.role} onLogout={handleLogout}>
                 <DSA userRole={user.role} />
               </MainLayout>
             ) : (
               <Navigate to="/login" />
             )
           } 
        />

        <Route 
           path="/attendance" 
           element={
             user && adminRoles.includes(user.role) ? (
               <MainLayout userRole={user.role} onLogout={handleLogout}>
                <Attendance />
               </MainLayout>
              ) : (
                <Navigate to="/dashboard" />
              )
           } 
        />

        <Route 
          path="/finance" 
          element={
            user && adminRoles.includes(user.role) ? (
              <MainLayout userRole={user.role} onLogout={handleLogout}>
                <Finance /> 
              </MainLayout>
            ) : (
              <Navigate to="/dashboard" />
            )
          } 
        />

        <Route 
          path="/lumpsum" 
          element={
            user && adminRoles.includes(user.role) ? (
              <MainLayout userRole={user.role} onLogout={handleLogout}>
                <Lumpsum /> 
              </MainLayout>
            ) : (
              <Navigate to="/dashboard" />
            )
          } 
        />

        {/* 5. CATCH-ALL REDIRECTS */}
        {/* If the user hits "/" or an unknown URL, they go to Dashboard (which redirects to Login if not signed in) */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;