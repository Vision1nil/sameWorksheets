"use client";

import { useState, useEffect } from "react";
import { UserDashboard } from "@/components/UserDashboard";
import { useUser } from "@clerk/nextjs";
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (isLoaded) {
      setIsLoading(false);
    }
  }, [isLoaded]);

  // Redirect to sign-in if not signed in
  if (isLoaded && !isSignedIn) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Dashboard</h1>
        <p className="text-muted-foreground">
          Track your progress, view recent activities, and manage your learning journey.
        </p>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      ) : isSignedIn && user?.id ? (
        <UserDashboard 
          userId={user.id} 
          userRole={{ role: 'student', userId: user.id }}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to view your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>You need to be signed in to access this page.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}