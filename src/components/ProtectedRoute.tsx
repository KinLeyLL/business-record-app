import type { ReactNode } from 'react';
import type { Role } from '../types/auth';

interface Props {
  children: ReactNode;
  userRole: Role;
  allowedRoles: Role[];
}

export default function ProtectedRoute({ children, userRole, allowedRoles }: Props) {
  // Check if the user's role is allowed to see this page
  const isAuthorized = allowedRoles.includes(userRole);

  if (!isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        Access Denied: You do not have permission to view this data.
      </div>
    );
  }

  return <>{children}</>;
}