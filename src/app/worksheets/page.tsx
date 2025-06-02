"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WorksheetList } from "@/components/worksheet/WorksheetList";
import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { SavedWorksheet } from "@/types/worksheet";

export default function WorksheetsPage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const [worksheets, setWorksheets] = useState<SavedWorksheet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to sign-in if not signed in
  if (isLoaded && !isSignedIn) {
    redirect("/sign-in");
  }

  useEffect(() => {
    if (isSignedIn && user?.id) {
      const fetchWorksheets = async () => {
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from('worksheets')
            .select('*')
            .eq('userId', user.id)
            .order('createdAt', { ascending: false });

          if (error) {
            throw error;
          }

          setWorksheets(data || []);
        } catch (err) {
          console.error('Error fetching worksheets:', err);
          setError('Failed to load worksheets. Please try again later.');
        } finally {
          setIsLoading(false);
        }
      };

      fetchWorksheets();

      // Set up real-time subscription
      const worksheetsSubscription = supabase
        .channel('worksheets-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'worksheets',
            filter: `userId=eq.${user.id}`
          }, 
          (payload) => {
            // Handle different types of changes
            if (payload.eventType === 'INSERT') {
              setWorksheets(prev => [payload.new as SavedWorksheet, ...prev]);
            } else if (payload.eventType === 'DELETE') {
              setWorksheets(prev => prev.filter(w => w.id !== payload.old.id));
            } else if (payload.eventType === 'UPDATE') {
              setWorksheets(prev => 
                prev.map(w => w.id === payload.new.id ? payload.new as SavedWorksheet : w)
              );
            }
          }
        )
        .subscribe();

      return () => {
        worksheetsSubscription.unsubscribe();
      };
    }
  }, [isSignedIn, user?.id]);

  const handleDeleteWorksheet = async (worksheetId: string) => {
    try {
      const { error } = await supabase
        .from('worksheets')
        .delete()
        .eq('id', worksheetId)
        .eq('userId', user?.id);

      if (error) {
        throw error;
      }

      // The real-time subscription will update the UI
    } catch (err) {
      console.error('Error deleting worksheet:', err);
      setError('Failed to delete worksheet. Please try again later.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Worksheets</h1>
        <p className="text-muted-foreground">
          View, manage, and interact with all your saved worksheets.
        </p>
      </div>
      
      <Card className="tech-card">
        <CardHeader className="pb-2">
          <CardTitle>Saved Worksheets</CardTitle>
          <CardDescription>
            All your generated worksheets in one place
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <p className="text-red-500">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
              >
                Try Again
              </button>
            </div>
          ) : (
            <WorksheetList 
              worksheets={worksheets} 
              onDeleteWorksheet={handleDeleteWorksheet}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
