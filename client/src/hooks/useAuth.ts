import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export function useAuth() {
  // Use a single endpoint that handles both staff and member authentication
  const { data: authData, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    staleTime: Infinity,
  });

  // If there's an error (like 401), user is not authenticated
  if (error) {
    return {
      user: null,
      isLoading: false,
      isAuthenticated: false,
    };
  }

  // If still loading, show loading state
  if (isLoading) {
    return {
      user: null,
      isLoading: true,
      isAuthenticated: false,
    };
  }

  // If we have auth data, user is authenticated
  if (authData) {
    const user = (authData as any).userType === 'staff' ? (authData as any).user : (authData as any).member;
    return {
      user,
      isLoading: false,
      isAuthenticated: true,
    };
  }

  // No auth data means not authenticated
  return {
    user: null,
    isLoading: false,
    isAuthenticated: false,
  };
}
