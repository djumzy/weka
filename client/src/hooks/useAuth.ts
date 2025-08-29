import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export function useAuth() {
  const [memberSession, setMemberSession] = useState<any>(null);
  const [shouldCheckAuth, setShouldCheckAuth] = useState(false);

  // Check for member session
  useEffect(() => {
    const sessionData = localStorage.getItem('memberSession');
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        setMemberSession(session);
        setShouldCheckAuth(false); // Don't check API if member session exists
      } catch (error) {
        console.error('Invalid member session data:', error);
        localStorage.removeItem('memberSession');
        setShouldCheckAuth(true); // Check API if member session invalid
      }
    } else {
      setShouldCheckAuth(true); // Check API if no member session
    }
  }, []);

  // Always call useQuery hook - never conditionally
  const { data: adminUser, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    staleTime: Infinity,
    enabled: shouldCheckAuth, // Control with state instead of inline condition
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

  // If we have member session, return member data
  if (memberSession) {
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
