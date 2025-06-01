"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  Plus,
  BookOpen,
  BarChart3,
  Calendar,
  Award,
  Clock,
  Download,
  Eye,
  Settings,
  Copy,
  UserPlus
} from "lucide-react";
import { db, type ClassRoom, type Assignment, type SavedWorksheet, formatTimeSpent } from "@/lib/database";

interface TeacherDashboardProps {
  teacherId: string;
  teacherName: string;
}

export function TeacherDashboard({ teacherId, teacherName }: TeacherDashboardProps) {
  const [classrooms, setClassrooms] = useState<ClassRoom[]>([]);
  const [savedWorksheets, setSavedWorksheets] = useState<SavedWorksheet[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [isAssignWorksheetOpen, setIsAssignWorksheetOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassRoom | null>(null);
  const [newClassName, setNewClassName] = useState("");
  const [newClassDescription, setNewClassDescription] = useState("");
  const [newClassGrade, setNewClassGrade] = useState("");

  useEffect(() => {
    loadTeacherData();
  }, [teacherId]);

  const loadTeacherData = async () => {
    try {
      const [classroomsData, worksheetsData] = await Promise.all([
        db.getTeacherClassrooms(teacherId),
        db.getUserWorksheets(teacherId)
      ]);

      setClassrooms(classroomsData);
      setSavedWorksheets(worksheetsData);

      // Load assignments for all classes
      const allAssignments = await Promise.all(
        classroomsData.map(classroom => db.getClassAssignments(classroom.id))
      );
      setAssignments(allAssignments.flat());
    } catch (error) {
      console.error('Error loading teacher data:', error);
    }
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim() || !newClassGrade.trim()) return;

    try {
      const newClass = await db.createClassroom({
        teacherId,
        name: newClassName,
        description: newClassDescription,
        grade: newClassGrade,
        students: [],
        isActive: true
      });

      setClassrooms([...classrooms, newClass]);
      setNewClassName("");
      setNewClassDescription("");
      setNewClassGrade("");
      setIsCreateClassOpen(false);
    } catch (error) {
      console.error('Error creating class:', error);
    }
  };

  const copyClassCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      // You could add a toast notification here
    } catch (error) {
      console.error('Error copying class code:', error);
    }
  };

  const handleAssignWorksheet = async (worksheetId: string, classId: string, dueDate?: Date) => {
    try {
      const worksheet = savedWorksheets.find(w => w.id === worksheetId);
      if (!worksheet) return;

      const assignment = await db.createAssignment({
        classId,
        worksheetId,
        title: worksheet.title,
        description: `${worksheet.type} worksheet for ${worksheet.grade}`,
        dueDate,
        isActive: true
      });

      setAssignments([...assignments, assignment]);
      setIsAssignWorksheetOpen(false);
    } catch (error) {
      console.error('Error assigning worksheet:', error);
    }
  };

  const getClassAnalytics = async (classId: string) => {
    try {
      return await db.getClassAnalytics(classId);
    } catch (error) {
      console.error('Error getting class analytics:', error);
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-background grid-pattern">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold glow-text">Teacher Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {teacherName}</p>
            </div>
            <div className="flex gap-3">
              <Dialog open={isCreateClassOpen} onOpenChange={setIsCreateClassOpen}>
                <DialogTrigger asChild>
                  <Button className="glow-border">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Class
                  </Button>
                </DialogTrigger>
                <DialogContent className="tech-card">
                  <DialogHeader>
                    <DialogTitle>Create New Class</DialogTitle>
                    <DialogDescription>
                      Set up a new classroom for your students
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Class Name</label>
                      <Input
                        placeholder="e.g., English 101, Advanced Grammar"
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        className="tech-border"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Grade Level</label>
                      <Input
                        placeholder="e.g., 5, 6-8, High School"
                        value={newClassGrade}
                        onChange={(e) => setNewClassGrade(e.target.value)}
                        className="tech-border"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description (Optional)</label>
                      <Textarea
                        placeholder="Brief description of the class..."
                        value={newClassDescription}
                        onChange={(e) => setNewClassDescription(e.target.value)}
                        className="tech-border"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setIsCreateClassOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateClass}>
                        Create Class
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 tech-border">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="worksheets">Worksheets</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="tech-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{classrooms.length}</p>
                      <p className="text-sm text-muted-foreground">Active Classes</p>
                    </div>
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="tech-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">
                        {classrooms.reduce((sum, cls) => sum + cls.students.length, 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Students</p>
                    </div>
                    <UserPlus className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="tech-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{savedWorksheets.length}</p>
                      <p className="text-sm text-muted-foreground">Saved Worksheets</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="tech-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{assignments.length}</p>
                      <p className="text-sm text-muted-foreground">Active Assignments</p>
                    </div>
                    <Calendar className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="tech-card">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest classroom and worksheet activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignments.slice(0, 5).map(assignment => {
                    const classroom = classrooms.find(c => c.id === assignment.classId);
                    return (
                      <div key={assignment.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                        <div>
                          <p className="font-medium">{assignment.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Assigned to {classroom?.name} • {assignment.assignedAt.toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline">{assignment.submissions.length} submissions</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Classes Tab */}
          <TabsContent value="classes" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classrooms.map(classroom => (
                <Card key={classroom.id} className="tech-card tech-hover">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{classroom.name}</CardTitle>
                      <Badge variant="outline">Grade {classroom.grade}</Badge>
                    </div>
                    <CardDescription>{classroom.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Class Code:</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono">
                          {classroom.code}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyClassCode(classroom.code)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Students:</span>
                      <Badge variant="outline">{classroom.students.length}</Badge>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Settings className="h-4 w-4 mr-1" />
                        Manage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Worksheets Tab */}
          <TabsContent value="worksheets" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Your Worksheets</h3>
              <Dialog open={isAssignWorksheetOpen} onOpenChange={setIsAssignWorksheetOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Calendar className="h-4 w-4 mr-2" />
                    Assign Worksheet
                  </Button>
                </DialogTrigger>
                <DialogContent className="tech-card">
                  <DialogHeader>
                    <DialogTitle>Assign Worksheet</DialogTitle>
                    <DialogDescription>
                      Choose a worksheet and class to create an assignment
                    </DialogDescription>
                  </DialogHeader>
                  {/* Assignment form would go here */}
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedWorksheets.map(worksheet => (
                <Card key={worksheet.id} className="tech-card tech-hover">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{worksheet.title}</CardTitle>
                      <Badge variant="secondary">
                        Grade {worksheet.grade}
                      </Badge>
                    </div>
                    <CardDescription>
                      {worksheet.type} • {worksheet.topics.length} topics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {worksheet.topics.slice(0, 3).map(topic => (
                        <Badge key={topic} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                      {worksheet.topics.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{worksheet.topics.length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span>Downloaded: {worksheet.downloadCount} times</span>
                      <span>{worksheet.createdAt.toLocaleDateString()}</span>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
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
                  <CardTitle>Class Performance Overview</CardTitle>
                  <CardDescription>Average scores across all classes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {classrooms.map(classroom => (
                      <div key={classroom.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                        <div>
                          <p className="font-medium">{classroom.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {classroom.students.length} students
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">85%</p>
                          <p className="text-xs text-muted-foreground">Avg Score</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="tech-card">
                <CardHeader>
                  <CardTitle>Worksheet Usage</CardTitle>
                  <CardDescription>Most popular worksheets</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {savedWorksheets
                      .sort((a, b) => b.downloadCount - a.downloadCount)
                      .slice(0, 5)
                      .map(worksheet => (
                        <div key={worksheet.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                          <div>
                            <p className="font-medium">{worksheet.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {worksheet.type} • Grade {worksheet.grade}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {worksheet.downloadCount} downloads
                          </Badge>
                        </div>
                      ))}
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
