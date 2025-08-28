import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export function useAuth() {
  const [memberSession, setMemberSession] = useState<any>(null);

  // Check for member session first
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

  // Only make API calls if there's no member session
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !memberSession, // Disable API calls when member session exists
  });

  // If member session exists, return member data as user
  if (memberSession) {
    return {
      user: memberSession.member,
      isLoading: false,
      isAuthenticated: true,
    };
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
