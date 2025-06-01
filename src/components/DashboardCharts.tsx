"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  Calendar,
  Clock,
  BookOpen,
  Target
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// Simple chart components using CSS and HTML
// In a production app, you might want to use a library like Chart.js, Recharts, or D3.js

interface ChartProps {
  data: {
    label: string;
    value: number;
    color: string;
  }[];
  height?: number;
}

interface DashboardChartsProps {
  userId: string;
  userRole: 'student'; // Simplified to only support student role
}

interface EmptyStateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

// Bar Chart Component
const BarChart = ({ data, height = 200 }: ChartProps) => {
  const maxValue = Math.max(...data.map(item => item.value));
  
  return (
    <div className="flex items-end justify-between h-[200px] gap-2">
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center flex-1">
          <div 
            className="w-full rounded-t-sm transition-all duration-500 ease-in-out"
            style={{ 
              height: `${(item.value / maxValue) * height}px`,
              backgroundColor: item.color,
            }}
          />
          <div className="text-xs mt-2 text-gray-400 w-full text-center truncate">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
};

// Pie Chart Component
const PieChartComponent = ({ data }: ChartProps) => {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  let cumulativePercentage = 0;
  
  return (
    <div className="relative w-[200px] h-[200px] mx-auto">
      <div 
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{ 
          background: `conic-gradient(${data.map(item => {
            const startPercentage = cumulativePercentage;
            const percentage = (item.value / total) * 100;
            cumulativePercentage += percentage;
            return `${item.color} ${startPercentage}% ${cumulativePercentage}%`;
          }).join(', ')})` 
        }}
      />
      <div className="absolute inset-[25%] bg-black rounded-full flex items-center justify-center">
        <span className="text-white font-bold">{total}</span>
      </div>
      <div className="mt-8 pt-[220px]">
        <div className="flex flex-wrap justify-center gap-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-gray-400">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Line Chart Component
const LineChartComponent = ({ data, height = 200 }: ChartProps) => {
  const maxValue = Math.max(...data.map(item => item.value));
  const points = data.map((item, index) => ({
    x: (index / (data.length - 1)) * 100,
    y: 100 - ((item.value / maxValue) * 100)
  }));
  
  const pathData = points.reduce((path, point, i) => {
    return path + `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
  }, '');
  
  return (
    <div className="relative h-[200px] w-full">
      <svg className="w-full h-full">
        <path 
          d={pathData} 
          fill="none" 
          stroke="url(#lineGradient)" 
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        {points.map((point, index) => (
          <circle 
            key={index}
            cx={`${point.x}%`} 
            cy={`${point.y}%`} 
            r="4" 
            fill="#8b5cf6"
          />
        ))}
      </svg>
      <div className="flex justify-between mt-2">
        {data.map((item, index) => (
          <div key={index} className="text-xs text-gray-400">
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export function DashboardCharts({ userId, userRole }: DashboardChartsProps) {
  const [performanceData, setPerformanceData] = useState<ChartProps['data']>([]);
  const [topicData, setTopicData] = useState<ChartProps['data']>([]);
  const [progressData, setProgressData] = useState<ChartProps['data']>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('performance');

  useEffect(() => {
    loadChartData();
    
    // Set up real-time subscription for updates
    const subscription = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'student_progress',
        filter: `user_id=eq.${userId}` // Always filter by user ID since we only have students
      }, payload => {
        // Refresh data when new progress is recorded
        loadChartData();
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [userId, userRole]);

  // Empty state component for charts
  const EmptyState = ({ title, description, icon }: EmptyStateProps) => (
    <div className="flex flex-col items-center justify-center h-[200px] text-center p-4 border border-dashed border-gray-800 rounded-lg bg-black/20">
      <div className="text-gray-500 mb-2">{icon}</div>
      <h3 className="text-gray-300 text-sm font-medium mb-1">{title}</h3>
      <p className="text-gray-500 text-xs max-w-xs">{description}</p>
    </div>
  );

  const loadChartData = async () => {
    setIsLoading(true);
    
    try {
      // Try to fetch real data from Supabase
      try {
        const { data: progressData, error } = await supabase
          .from('student_progress')
          .select('*')
          .eq('user_id', userId);
          
        if (error) throw error;
        
        if (progressData && progressData.length > 0) {
          // We have real data, process it
          
          // Performance over time (last 7 days)
          const today = new Date();
          const days: Array<{
            date: Date;
            label: string;
            value: number;
            count: number;
          }> = [];
          const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          
          // Generate the last 7 days
          for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            days.push({
              date,
              label: dayLabels[date.getDay()],
              value: 0,
              count: 0
            });
          }
          
          // Map progress data to days
          progressData.forEach(progress => {
            const progressDate = new Date(progress.completed_at);
            const dayIndex = days.findIndex(day => 
              day.date.getDate() === progressDate.getDate() && 
              day.date.getMonth() === progressDate.getMonth() && 
              day.date.getFullYear() === progressDate.getFullYear()
            );
            
            if (dayIndex !== -1) {
              days[dayIndex].value += progress.score;
              days[dayIndex].count += 1;
            }
          });
          
          // Calculate average scores per day
          const performanceByDay = days.map(day => ({
            label: day.label,
            value: day.count > 0 ? day.value / day.count : 0,
            color: '#4f46e5'
          }));
          
          // Topic distribution - from real data if available
          const topicCounts: Record<string, { count: number, color: string }> = {};
          const topicColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#6366f1', '#14b8a6', '#f43f5e'];
          let colorIndex = 0;
          
          // Count topics from worksheets
          const { data: worksheets } = await supabase
            .from('worksheets')
            .select('*')
            .eq('user_id', userId);
            
          if (worksheets) {
            worksheets.forEach(worksheet => {
              if (worksheet.topics && Array.isArray(worksheet.topics)) {
                worksheet.topics.forEach((topic: string) => {
                  if (!topicCounts[topic]) {
                    topicCounts[topic] = { 
                      count: 0, 
                      color: topicColors[colorIndex % topicColors.length] 
                    };
                    colorIndex++;
                  }
                  topicCounts[topic].count += 1;
                });
              }
            });
          }
          
          const topicDistribution = Object.entries(topicCounts)
            .map(([label, { count, color }]) => ({
              label,
              value: count,
              color
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Show top 5 topics
          
          // Progress by difficulty
          const difficultyData: Record<string, { total: number, count: number, color: string }> = {
            'easy': { total: 0, count: 0, color: '#10b981' },
            'medium': { total: 0, count: 0, color: '#f59e0b' },
            'hard': { total: 0, count: 0, color: '#ef4444' }
          };
          
          // Calculate progress by difficulty
          if (worksheets && progressData) {
            progressData.forEach(progress => {
              const worksheet = worksheets.find(w => w.id === progress.worksheet_id);
              if (worksheet && worksheet.difficulty) {
                const difficulty = worksheet.difficulty.toLowerCase();
                if (difficultyData[difficulty]) {
                  difficultyData[difficulty].total += progress.score;
                  difficultyData[difficulty].count += 1;
                }
              }
            });
          }
          
          const progressByDifficulty = Object.entries(difficultyData)
            .map(([label, { total, count, color }]) => ({
              label: label.charAt(0).toUpperCase() + label.slice(1),
              value: count > 0 ? (total / count) : 0,
              color
            }));
          
          setPerformanceData(performanceByDay);
          setTopicData(topicDistribution.length > 0 ? topicDistribution : []);
          setProgressData(progressByDifficulty);
          
          return; // Exit early since we have real data
        }
      } catch (error) {
        console.error('Error fetching real data:', error);
        // Fall back to mock data
      }
      
      // If we get here, we don't have real data, so use empty or mock data
      // Performance over time (last 7 days)
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const performanceByDay = days.map(day => ({
        label: day,
        value: 0, // Start with empty data
        color: '#4f46e5'
      }));
      
      // Topic distribution - empty
      const topicDistribution: ChartProps['data'] = [];
      
      // Progress by difficulty - empty
      const difficulties = ['Easy', 'Medium', 'Hard'];
      const progressByDifficulty = difficulties.map(difficulty => ({
        label: difficulty,
        value: 0, // Start with empty data
        color: ['#10b981', '#f59e0b', '#ef4444'][difficulties.indexOf(difficulty)]
      }));
      
      setPerformanceData(performanceByDay);
      setTopicData(topicDistribution);
      setProgressData(progressByDifficulty);
      
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-black/50 border-white/10">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/50 border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Analytics Dashboard
          </CardTitle>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
            Real-time
          </Badge>
        </div>
        <CardDescription className="text-gray-400">
          {false 
            ? 'Visualize student performance and engagement metrics'
            : 'Track your learning progress across different topics and difficulty levels'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-black/50 border border-white/10">
            <TabsTrigger value="performance" className="text-white data-[state=active]:bg-blue-600">
              <TrendingUp className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="topics" className="text-white data-[state=active]:bg-blue-600">
              <BookOpen className="h-4 w-4 mr-2" />
              Topics
            </TabsTrigger>
            <TabsTrigger value="progress" className="text-white data-[state=active]:bg-blue-600">
              <Target className="h-4 w-4 mr-2" />
              By Difficulty
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="performance" className="space-y-4">
            <div className="bg-black/30 p-4 rounded-lg border border-white/5">
              <h3 className="text-sm font-medium text-white mb-4">Weekly Performance</h3>
              {performanceData.some(item => item.value > 0) ? (
                <LineChartComponent data={performanceData} />
              ) : (
                <EmptyState 
                  title="No performance data yet"
                  description="Complete worksheets to see your weekly performance trends"
                  icon={<LineChart className="h-8 w-8" />}
                />
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="topics" className="space-y-4">
            <div className="bg-black/30 p-4 rounded-lg border border-white/5">
              <h3 className="text-sm font-medium text-white mb-4">Topic Distribution</h3>
              {topicData.length > 0 ? (
                <PieChartComponent data={topicData} />
              ) : (
                <EmptyState 
                  title="No topic data yet"
                  description="Create worksheets with different topics to see your topic distribution"
                  icon={<PieChart className="h-8 w-8" />}
                />
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="progress" className="space-y-4">
            <div className="bg-black/30 p-4 rounded-lg border border-white/5">
              <h3 className="text-sm font-medium text-white mb-4">Progress by Difficulty</h3>
              {progressData.some(item => item.value > 0) ? (
                <BarChart data={progressData} />
              ) : (
                <EmptyState 
                  title="No difficulty data yet"
                  description="Complete worksheets of varying difficulty to see your progress"
                  icon={<BarChart3 className="h-8 w-8" />}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
