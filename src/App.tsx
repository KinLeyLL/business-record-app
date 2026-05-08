import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
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
  const [user, setUser] = useState<{ role: string } | null>(null);

  const handleLogin = (role: string) => setUser({ role });
  const handleLogout = () => setUser(null);

  return (
    <Router>
      <Routes>
        {/* 1. LOGIN PAGE */}
        <Route path="/login" element={<Login onLogin={handleLogin} />} />

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
            user ? (
              <MainLayout userRole={user.role} onLogout={handleLogout}>
                <Projects />
              </MainLayout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        <Route 
           path="/dsa" 
           element={
             user ? (
               <MainLayout userRole={user.role} onLogout={handleLogout}>
                 <DSA />
               </MainLayout>
             ) : (
               <Navigate to="/login" />
             )
           } 
        />

        <Route 
           path="/attendance" 
           element={
             (user?.role === 'ADMIN' || user?.role === 'MANAGER') ? (
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
            user?.role === 'ADMIN' ? (
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
            user?.role === 'ADMIN' ? (
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