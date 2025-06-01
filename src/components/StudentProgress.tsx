"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  Award,
  Clock,
  BookOpen,
  Target,
  Calendar,
  BarChart3,
  Trophy,
  CheckCircle,
  Circle
} from "lucide-react";
import { db, type StudentProgress as StudentProgressType, formatTimeSpent } from "@/lib/database";

interface StudentProgressProps {
  userId: string;
  studentName?: string;
}

interface ProgressStats {
  totalWorksheets: number;
  averageScore: number;
  totalTimeSpent: number;
  progressByType: Record<string, { completed: number; averageScore: number }>;
  progressByGrade: Record<string, { completed: number; averageScore: number }>;
  studyStreak?: {
    current: number;
    best: number;
  };
}

export function StudentProgress({ userId, studentName = 'Student' }: StudentProgressProps) {
  const [progress, setProgress] = useState<StudentProgressType[]>([]);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudentData();
  }, [userId]);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      const [progressData, statsData] = await Promise.all([
        db.getStudentProgress(userId),
        db.getStudentAnalytics(userId)
      ]);

      setProgress(progressData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 80) return "text-blue-500";
    if (score >= 70) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return "default";
    if (score >= 80) return "secondary";
    return "outline";
  };

  const getAchievementLevel = (score: number) => {
    if (score >= 95) return { title: "Excellent", icon: Trophy, color: "text-yellow-500" };
    if (score >= 90) return { title: "Outstanding", icon: Award, color: "text-blue-500" };
    if (score >= 80) return { title: "Good", icon: Target, color: "text-green-500" };
    if (score >= 70) return { title: "Satisfactory", icon: CheckCircle, color: "text-orange-500" };
    return { title: "Needs Improvement", icon: Circle, color: "text-red-500" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">Loading progress data...</p>
        </div>
      </div>
    );
  }
  
  // Empty state when no progress data is available
  if (progress.length === 0) {
    return (
      <Card className="tech-card">
        <CardContent className="p-6 flex flex-col items-center justify-center text-center">
          <BookOpen className="h-12 w-12 text-primary/50 mb-4" />
          <h3 className="text-xl font-medium mb-2">No Progress Data Yet</h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            Complete worksheets to start tracking your progress and see detailed analytics here.
          </p>
          <Button 
            variant="outline" 
            className="bg-blue-600/20 border-blue-500/30 text-blue-300 hover:bg-blue-600/30"
            onClick={() => window.location.href = '/'}
          >
            Start Learning
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm mb-6">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold glow-text">Your Progress</h1>
              <p className="text-muted-foreground text-sm">Learning Journey</p>
            </div>
            <Badge variant="secondary" className="tech-border">
              <TrendingUp className="h-3 w-3 mr-1" />
              {stats?.averageScore.toFixed(0)}% Avg Score
            </Badge>
          </div>
        </div>
      </header>

      <main className="px-6 py-4">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Achievements
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="tech-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{stats?.totalWorksheets || 0}</p>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="tech-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-2xl font-bold ${getScoreColor(stats?.averageScore || 0)}`}>
                        {stats?.averageScore.toFixed(0)}%
                      </p>
                      <p className="text-sm text-muted-foreground">Average Score</p>
                    </div>
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="tech-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">
                        {formatTimeSpent(stats?.totalTimeSpent || 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">Time Spent</p>
                    </div>
                    <Clock className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="tech-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{stats?.studyStreak?.current || 0}</p>
                      <p className="text-sm text-muted-foreground">Day Streak</p>
                    </div>
                    <Award className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Progress */}
            <Card className="tech-card">
              <CardHeader>
                <CardTitle>Recent Progress</CardTitle>
                <CardDescription>Your latest worksheet completions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {progress.slice(0, 5).map(item => {
                    const achievement = getAchievementLevel(item.score || 0);
                    return (
                      <div key={item.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 tech-hover">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg bg-primary/10`}>
                            <achievement.icon className={`h-5 w-5 ${achievement.color}`} />
                          </div>
                          <div>
                            <p className="font-medium">Worksheet #{item.worksheetId.slice(-6)}</p>
                            <p className="text-sm text-muted-foreground">
                              Completed {item.completedAt?.toLocaleDateString()} •
                              Took {formatTimeSpent(item.timeSpent)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={getScoreBadgeVariant(item.score || 0)}>
                            {item.score}%
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {achievement.title}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Progress by Subject */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="tech-card">
                <CardHeader>
                  <CardTitle>Progress by Subject</CardTitle>
                  <CardDescription>Performance across different topics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(stats?.progressByType || {}).map(([type, data]) => (
                    <div key={type} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium capitalize">{type}</span>
                        <span className="text-sm text-muted-foreground">
                          {data.completed} completed • {data.averageScore.toFixed(0)}% avg
                        </span>
                      </div>
                      <Progress value={data.averageScore} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="tech-card">
                <CardHeader>
                  <CardTitle>Weekly Goal</CardTitle>
                  <CardDescription>Complete 5 worksheets this week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Progress</span>
                      <span className="font-medium">3 / 5 worksheets</span>
                    </div>
                    <Progress value={60} className="h-3" />
                    <p className="text-sm text-muted-foreground">
                      Great job! You're 60% towards your weekly goal. Keep it up!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>



          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "First Worksheet", description: "Complete your first worksheet", earned: true, icon: BookOpen },
                { title: "Perfect Score", description: "Score 100% on any worksheet", earned: stats?.averageScore === 100, icon: Trophy },
                { title: "Speed Demon", description: "Complete a worksheet in under 10 minutes", earned: false, icon: Clock },
                { title: "Consistent Learner", description: "Complete worksheets 5 days in a row", earned: false, icon: Calendar },
                { title: "Subject Master", description: "Score 90%+ on 10 worksheets in one subject", earned: false, icon: Award },
                { title: "Time Scholar", description: "Spend 100+ hours on worksheets", earned: (stats?.totalTimeSpent || 0) >= 6000, icon: BarChart3 }
              ].map((achievement, index) => (
                <Card key={index} className={`tech-card ${achievement.earned ? 'glow-border' : 'opacity-60'}`}>
                  <CardContent className="p-6 text-center">
                    <div className={`p-3 rounded-lg mx-auto mb-4 w-fit ${
                      achievement.earned ? 'bg-yellow-500/10 text-yellow-500' : 'bg-gray-500/10 text-gray-500'
                    }`}>
                      <achievement.icon className="h-8 w-8" />
                    </div>
                    <h3 className="font-semibold mb-2">{achievement.title}</h3>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    {achievement.earned && (
                      <Badge className="mt-3" variant="default">Earned!</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="tech-card">
                <CardHeader>
                  <CardTitle>Score Trends</CardTitle>
                  <CardDescription>Your performance over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {progress.slice(-10).map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <span className="text-sm">Worksheet {index + 1}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={item.score || 0} className="w-20 h-2" />
                          <span className="text-sm font-medium w-12">{item.score}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="tech-card">
                <CardHeader>
                  <CardTitle>Study Habits</CardTitle>
                  <CardDescription>Insights into your learning patterns</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Average time per worksheet:</span>
                    <span className="font-medium">
                      {formatTimeSpent(Math.round((stats?.totalTimeSpent || 0) / (stats?.totalWorksheets || 1)))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Best subject:</span>
                    <span className="font-medium">Grammar</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Improvement area:</span>
                    <span className="font-medium">Reading Comprehension</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Study streak:</span>
                    <span className="font-medium">3 days</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
