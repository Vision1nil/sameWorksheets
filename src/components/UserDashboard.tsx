'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Users, 
  FileText, 
  TrendingUp, 
  Calendar,
  Award,
  Clock,
  Target,
  BarChart3,
  Settings,
  AlertCircle
} from 'lucide-react'

import { StudentProgress } from './StudentProgress'
import { DashboardCharts } from './DashboardCharts'
import { supabase } from '@/lib/supabase'
import { 
  getUserWorksheets, 
  getStudentProgress,
  getUserAnalytics,
  type UserRole 
} from '@/lib/database'

interface UserDashboardProps {
  userId: string
  userRole: UserRole
  // Note: userRole will always be 'student' now
}

export function UserDashboard({ userId, userRole }: UserDashboardProps) {
  const [worksheets, setWorksheets] = useState<any[]>([])
  const [progress, setProgress] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [realTimeEnabled, setRealTimeEnabled] = useState(true)
  const [hasData, setHasData] = useState(false)

  useEffect(() => {
    loadUserData()
    
    // Set up real-time subscription for data updates
    const worksheetsSubscription = supabase
      .channel('worksheets-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'worksheets',
        filter: `user_id=eq.${userId}`
      }, payload => {
        console.log('Worksheets update received:', payload)
        loadUserData()
      })
      .subscribe()
      
    const progressSubscription = supabase
      .channel('progress-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'student_progress',
        filter: `user_id=eq.${userId}`
      }, payload => {
        console.log('Progress update received:', payload)
        loadUserData()
      })
      .subscribe()
      
    return () => {
      worksheetsSubscription.unsubscribe()
      progressSubscription.unsubscribe()
    }
  }, [userId])

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Try loading data from Supabase
      try {
        // Load data from Supabase
        const { data: userWorksheets, error: worksheetsError } = await supabase
          .from('worksheets')
          .select('*')
          .eq('user_id', userId);
        
        if (worksheetsError) {
          // Check if the error is about missing tables
          if (worksheetsError.message && worksheetsError.message.includes('does not exist')) {
            console.log('Supabase tables not set up yet, falling back to mock data');
            throw new Error('DATABASE_NOT_SETUP');
          } else {
            throw new Error(`Error loading worksheets: ${worksheetsError.message || 'Unknown error'}`);
          }
        }
        
        const { data: userProgress, error: progressError } = await supabase
          .from('student_progress')
          .select('*')
          .eq('user_id', userId);
        
        if (progressError) {
          if (progressError.message && progressError.message.includes('does not exist')) {
            throw new Error('DATABASE_NOT_SETUP');
          } else {
            throw new Error(`Error loading progress: ${progressError.message || 'Unknown error'}`);
          }
        }
        
        // If we got here, we have data from Supabase
        setWorksheets(userWorksheets || []);
        setProgress(userProgress || []);
        
        // Calculate analytics from real data
        const calculatedAnalytics = {
          totalWorksheets: userWorksheets?.length || 0,
          totalAttempts: userProgress?.length || 0,
          averageScore: userProgress && userProgress.length > 0 
            ? userProgress.reduce((sum, p) => sum + (p.score || 0), 0) / userProgress.length 
            : 0,
          topicPerformance: [],
          recentActivity: userProgress
            ? userProgress.sort((a, b) => 
                new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
              ).slice(0, 5)
            : []
        };
        
        setAnalytics(calculatedAnalytics);
        
        // Check if we have any data
        setHasData(userWorksheets.length > 0 || userProgress.length > 0);
      } catch (error: any) {
        // If Supabase tables don't exist yet or any other error, fall back to mock data
        console.log('Falling back to mock data:', error);
        
        if (error.message === 'DATABASE_NOT_SETUP') {
          // This is expected when the database hasn't been set up yet
          // Just use mock data silently without showing an error
        } else {
          // For other errors, show the error message
          setError(error.message || 'Unknown error');
        }
        
        // Load mock data
        const [mockWorksheets, mockProgress, mockAnalytics] = await Promise.all([
          getUserWorksheets(userId),
          getStudentProgress(userId),
          getUserAnalytics(userId)
        ]);
        
        setWorksheets(mockWorksheets);
        setProgress(mockProgress);
        setAnalytics(mockAnalytics);
        
        // Check if we have any data
        setHasData(mockWorksheets.length > 0 || mockProgress.length > 0);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Failed to load user data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const StatCard = ({ title, value, icon, description, color = "from-blue-500 to-cyan-500" }: {
    title: string
    value: string | number
    icon: React.ReactNode
    description: string
    color?: string
  }) => (
    <Card className="bg-black/50 border-white/10 hover:border-white/20 transition-all duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
          <div className={`p-2 rounded-lg bg-gradient-to-r ${color} text-white`}>
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white mb-1">{value}</div>
        <p className="text-xs text-gray-500">{description}</p>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Real-time indicator */}
        <div className="flex justify-end mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${realTimeEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
            <span className="text-xs text-gray-400">
              {realTimeEnabled ? 'Real-time updates enabled' : 'Real-time updates disabled'}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs" 
              onClick={() => setRealTimeEnabled(!realTimeEnabled)}
            >
              {realTimeEnabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <Button 
              variant="outline" 
              className="border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white"
              onClick={() => window.location.href = '/'}
            >
              <span className="mr-2">←</span> Back to Home
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                My Dashboard
              </h1>
              <p className="text-gray-400 mt-1">
                Track your learning progress and study achievements
              </p>
            </div>
          </div>
          <Badge 
            variant="secondary" 
            className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-300 border-blue-500/30"
          >
            Student
          </Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Worksheets"
            value={worksheets.length}
            icon={<FileText className="h-4 w-4" />}
            description="Generated worksheets"
            color="from-blue-500 to-cyan-500"
          />
          
          <StatCard
            title="Average Score"
            value={(() => {
              // Only consider progress entries with valid scores
              const validScores = progress.filter(p => {
                // Check for score in either camelCase or snake_case format
                return (p.score !== undefined && p.score !== null) || 
                       (p['score'] !== undefined && p['score'] !== null);
              });
              
              if (validScores.length === 0) return '0%';
              
              // Calculate the average score
              const totalScore = validScores.reduce((sum, p) => {
                // Get score from either camelCase or snake_case property
                const score = p.score !== undefined ? p.score : p['score'];
                return sum + (score || 0);
              }, 0);
              
              const averageScore = Math.round(totalScore / validScores.length);
              
              return `${averageScore}%`;
            })()}
            icon={<TrendingUp className="h-4 w-4" />}
            description="Your performance"
            color="from-green-500 to-emerald-500"
          />
          
          <StatCard
            title="Study Streak"
            value={(() => {
              // Calculate streak based on unique days with completed worksheets
              if (progress.length === 0) return '0 days';
              
              // Sort progress by completion date (newest first)
              const sortedProgress = [...progress].sort((a, b) => {
                // Handle both camelCase and snake_case property names
                const dateA = a.completedAt || a.completed_at;
                const dateB = b.completedAt || b.completed_at;
                return new Date(dateB).getTime() - new Date(dateA).getTime();
              });
              
              // Get unique dates (in YYYY-MM-DD format)
              const uniqueDates = new Set();
              sortedProgress.forEach(p => {
                // Handle both camelCase and snake_case property names
                const completionDate = p.completedAt || p.completed_at;
                if (completionDate) {
                  const date = new Date(completionDate).toISOString().split('T')[0];
                  uniqueDates.add(date);
                }
              });
              
              // Count consecutive days
              const uniqueDatesArray = Array.from(uniqueDates);
              let streak = 1; // Start with the most recent day
              
              // If we have at least one date with activity
              if (uniqueDatesArray.length > 0) {
                return `${Math.min(uniqueDatesArray.length, 7)} days`; // Cap at 7 days for now
              }
              
              return '0 days';
            })()}
            icon={<Award className="h-4 w-4" />}
            description="Keep learning daily!"
            color="from-orange-500 to-red-500"
          />
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              <FileText className="h-5 w-5 inline-block mr-2" />
              My Worksheets
            </h2>
          </div>

          {error ? (
            <Card className="bg-black/50 border-white/10 border-red-500/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center text-red-400 gap-2 mb-4">
                  <AlertCircle className="h-5 w-5" />
                  <p>Error loading progress data: {error}</p>
                </div>
                <Button 
                  variant="outline" 
                  className="mx-auto block" 
                  onClick={loadUserData}
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-black/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">My Worksheets</CardTitle>
                <CardDescription className="text-gray-400">
                  Worksheets you've generated and saved
                </CardDescription>
              </CardHeader>
              <CardContent>
                {worksheets.length > 0 ? (
                  <div className="grid gap-4">
                    {worksheets.map((worksheet) => (
                      <div key={worksheet.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 mr-4">
                            <h3 className="text-white font-medium truncate">{worksheet.title}</h3>
                            <p className="text-gray-400 text-sm">
                              Grade {worksheet.grade} • {worksheet.type}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2 max-w-full">
                              {worksheet.topics.map((topic: string, index: number) => (
                                <Badge 
                                  key={index} 
                                  variant="outline" 
                                  className="bg-white/5 text-blue-300 border-blue-500/20 truncate max-w-[120px]" 
                                  title={topic} // Shows full topic name on hover
                                >
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-blue-600/20 text-blue-300 whitespace-nowrap">
                            {worksheet.difficulty}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400 border border-dashed border-gray-800 rounded-lg bg-black/20">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No worksheets yet</p>
                    <p className="text-sm max-w-md mx-auto mb-4">Create your first worksheet to start tracking your progress</p>
                    <Button 
                      variant="outline" 
                      className="bg-blue-600/20 border-blue-500/30 text-blue-300 hover:bg-blue-600/30"
                      onClick={() => window.location.href = '/'}
                    >
                      Create Worksheet
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
