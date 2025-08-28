import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export function useAuth() {
  const [memberSession, setMemberSession] = useState<any>(null);

  // Check for member session
  useEffect(() => {
    const sessionData = localStorage.getItem('memberSession');
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        setMemberSession(session);
      } catch (error) {
        console.error('Invalid member session data:', error);
        localStorage.removeItem('memberSession');
      }
    }
  }, []);

  // Always try admin authentication first, but disable when member session exists
  const { data: adminUser, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    staleTime: Infinity,
    enabled: !memberSession, // Don't make API calls if member session exists
  });

  // Priority: Admin authentication first, then member session
  if (adminUser) {
    // Admin is authenticated - return admin user
    return {
      user: adminUser,
      isLoading: false,
      isAuthenticated: true,
    };
  }

  // If no admin auth but member session exists, return member data
  if (!isLoading && memberSession) {
    return {
      user: memberSession.member,
      isLoading: false,
      isAuthenticated: true,
    };
  }

  return {
    user: adminUser,
    isLoading,
    isAuthenticated: !!adminUser,
  };
}
