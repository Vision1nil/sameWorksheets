'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Settings
} from 'lucide-react'
import { TeacherDashboard } from './TeacherDashboard'
import { StudentProgress } from './StudentProgress'
import { 
  getUserWorksheets, 
  getStudentProgress,
  getUserAnalytics,
  getStudentClassrooms,
  getTeacherClassrooms,
  type UserRole 
} from '@/lib/database'

interface UserDashboardProps {
  userId: string
  userRole: UserRole
}

export function UserDashboard({ userId, userRole }: UserDashboardProps) {
  const [worksheets, setWorksheets] = useState<any[]>([])
  const [progress, setProgress] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadUserData()
  }, [userId, userRole.role])

  const loadUserData = async () => {
    try {
      setIsLoading(true)
      
      // Load common data
      const [userWorksheets, userProgress, userAnalytics] = await Promise.all([
        getUserWorksheets(userId),
        getStudentProgress(userId),
        getUserAnalytics(userId)
      ])
      
      setWorksheets(userWorksheets)
      setProgress(userProgress)
      setAnalytics(userAnalytics)
      
      // Load role-specific data
      if (userRole.role === 'teacher') {
        const teacherClassrooms = await getTeacherClassrooms(userId)
        setClassrooms(teacherClassrooms)
      } else if (userRole.role === 'student') {
        const studentClassrooms = await getStudentClassrooms(userId)
        setClassrooms(studentClassrooms)
      }
      
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setIsLoading(false)
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {userRole.role === 'teacher' ? 'Teacher Dashboard' : 'Student Dashboard'}
            </h1>
            <p className="text-gray-400 mt-1">
              {userRole.role === 'teacher' 
                ? 'Manage your classes and track student progress' 
                : 'Track your learning progress and complete assignments'
              }
            </p>
          </div>
          <Badge 
            variant="secondary" 
            className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-300 border-blue-500/30"
          >
            {userRole.role === 'teacher' ? 'Teacher' : 'Student'}
          </Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Worksheets"
            value={worksheets.length}
            icon={<FileText className="h-4 w-4" />}
            description={userRole.role === 'teacher' ? 'Created worksheets' : 'Generated worksheets'}
            color="from-blue-500 to-cyan-500"
          />
          
          <StatCard
            title={userRole.role === 'teacher' ? 'Total Classes' : 'Assignments'}
            value={userRole.role === 'teacher' ? classrooms.length : progress.length}
            icon={userRole.role === 'teacher' ? <Users className="h-4 w-4" /> : <Target className="h-4 w-4" />}
            description={userRole.role === 'teacher' ? 'Active classrooms' : 'Completed assignments'}
            color="from-purple-500 to-pink-500"
          />
          
          <StatCard
            title="Average Score"
            value={analytics ? `${Math.round(analytics.averageScore)}%` : '0%'}
            icon={<TrendingUp className="h-4 w-4" />}
            description={userRole.role === 'teacher' ? 'Class average' : 'Your performance'}
            color="from-green-500 to-emerald-500"
          />
          
          <StatCard
            title={userRole.role === 'teacher' ? 'Active Students' : 'Study Streak'}
            value={userRole.role === 'teacher' ? 
              classrooms.reduce((total, classroom) => total + classroom.studentIds.length, 0) : 
              `${progress.length} days`
            }
            icon={userRole.role === 'teacher' ? <Users className="h-4 w-4" /> : <Award className="h-4 w-4" />}
            description={userRole.role === 'teacher' ? 'Across all classes' : 'Keep it up!'}
            color="from-orange-500 to-red-500"
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue={userRole.role === 'teacher' ? 'classes' : 'progress'} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-black/50 border border-white/10">
            {userRole.role === 'teacher' ? (
              <>
                <TabsTrigger value="classes" className="text-white data-[state=active]:bg-blue-600">
                  <Users className="h-4 w-4 mr-2" />
                  Classes
                </TabsTrigger>
                <TabsTrigger value="analytics" className="text-white data-[state=active]:bg-blue-600">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="worksheets" className="text-white data-[state=active]:bg-blue-600">
                  <FileText className="h-4 w-4 mr-2" />
                  Worksheets
                </TabsTrigger>
              </>
            ) : (
              <>
                <TabsTrigger value="progress" className="text-white data-[state=active]:bg-blue-600">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Progress
                </TabsTrigger>
                <TabsTrigger value="assignments" className="text-white data-[state=active]:bg-blue-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  Assignments
                </TabsTrigger>
                <TabsTrigger value="worksheets" className="text-white data-[state=active]:bg-blue-600">
                  <FileText className="h-4 w-4 mr-2" />
                  My Worksheets
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {userRole.role === 'teacher' ? (
            <>
              <TabsContent value="classes">
                <TeacherDashboard userId={userId} />
              </TabsContent>
              <TabsContent value="analytics">
                <Card className="bg-black/50 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Class Analytics</CardTitle>
                    <CardDescription className="text-gray-400">
                      Overview of your students' performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-gray-400">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Detailed analytics coming soon...</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="worksheets">
                <Card className="bg-black/50 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">My Worksheets</CardTitle>
                    <CardDescription className="text-gray-400">
                      Worksheets you've created and shared
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {worksheets.length > 0 ? (
                      <div className="grid gap-4">
                        {worksheets.map((worksheet) => (
                          <div key={worksheet.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-white font-medium">{worksheet.title}</h3>
                                <p className="text-gray-400 text-sm">
                                  Grade {worksheet.grade} • {worksheet.type} • {worksheet.topics.length} topics
                                </p>
                              </div>
                              <Badge variant="secondary" className="bg-blue-600/20 text-blue-300">
                                {worksheet.difficulty}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-400">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No worksheets created yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          ) : (
            <>
              <TabsContent value="progress">
                <StudentProgress userId={userId} />
              </TabsContent>
              <TabsContent value="assignments">
                <Card className="bg-black/50 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">My Assignments</CardTitle>
                    <CardDescription className="text-gray-400">
                      Assignments from your teachers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-gray-400">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No assignments available</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="worksheets">
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
                              <div>
                                <h3 className="text-white font-medium">{worksheet.title}</h3>
                                <p className="text-gray-400 text-sm">
                                  Grade {worksheet.grade} • {worksheet.type} • {worksheet.topics.length} topics
                                </p>
                              </div>
                              <Badge variant="secondary" className="bg-blue-600/20 text-blue-300">
                                {worksheet.difficulty}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-400">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No worksheets created yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  )
}