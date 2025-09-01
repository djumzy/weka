import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export function useAuth() {
  // Check for staff authentication first
  const { data: staffAuthData, isLoading: staffLoading, error: staffError } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    staleTime: Infinity,
  });

  // Check for member authentication if staff auth fails
  const { data: memberAuthData, isLoading: memberLoading, error: memberError } = useQuery({
    queryKey: ["/api/member-session"],
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    staleTime: Infinity,
    enabled: !!staffError, // Only check member session if staff auth fails
  });

  // If staff auth is loading, show loading state
  if (staffLoading) {
    return {
      user: null,
      isLoading: true,
      isAuthenticated: false,
    };
  }

  // If staff auth succeeds, return staff user
  if (staffAuthData && (staffAuthData as any).userType === 'staff') {
    return {
      user: (staffAuthData as any).user,
      isLoading: false,
      isAuthenticated: true,
    };
  }

  // If member auth is loading after staff failed, show loading state
  if (memberLoading) {
    return {
      user: null,
      isLoading: true,
      isAuthenticated: false,
    };
  }

  // If member auth succeeds, return member user
  if (memberAuthData && (memberAuthData as any).userType === 'member') {
    return {
      user: (memberAuthData as any).member,
      isLoading: false,
      isAuthenticated: true,
    };
  }

  // Both auth methods failed - not authenticated
  return {
    user: null,
    isLoading: false,
    isAuthenticated: false,
  };
}
