"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllGrades, getGradeTopics, type Topic } from "@/lib/topics";
import { BookOpen, Brain, FileText, Sparkles, Target, Zap } from "lucide-react";
import { WorksheetGenerator } from "@/components/WorksheetGenerator";
import { AuthButton } from "@/components/AuthButton";
import { RoleSelector } from "@/components/RoleSelector";
import { UserDashboard } from "@/components/UserDashboard";
import { useUser } from "@clerk/nextjs";
import { getUserRole } from "@/lib/database";
import { useEffect } from "react";

export default function HomePage() {
  const { user, isSignedIn } = useUser();
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [userRole, setUserRole] = useState<{ role: 'student' | 'teacher' | 'admin' } | null>(null);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  const grades = getAllGrades();
  const gradeTopics = selectedGrade ? getGradeTopics(selectedGrade) : null;

  // Check user role when signed in
  useEffect(() => {
    if (isSignedIn && user?.id) {
      getUserRole(user.id).then(role => {
        if (role) {
          setUserRole(role);
        } else {
          // New user, show role selector
          setShowRoleSelector(true);
        }
      });
    }
  }, [isSignedIn, user?.id]);

  const handleRoleSelected = (role: 'student' | 'teacher') => {
    setUserRole({ role });
    setShowRoleSelector(false);
  };

  const worksheetTypes = [
    {
      id: "grammar",
      title: "Grammar",
      description: "Sentence structure, parts of speech, and language mechanics",
      icon: <FileText className="h-6 w-6" />,
      color: "from-blue-500 to-cyan-500"
    },
    {
      id: "vocabulary",
      title: "Vocabulary",
      description: "Word meanings, etymology, and language expansion",
      icon: <Brain className="h-6 w-6" />,
      color: "from-purple-500 to-pink-500"
    },
    {
      id: "readingComprehension",
      title: "Reading Comprehension",
      description: "Text analysis, critical thinking, and interpretation",
      icon: <BookOpen className="h-6 w-6" />,
      color: "from-green-500 to-emerald-500"
    }
  ];

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopics(prev =>
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleGenerateWorksheet = async () => {
    if (!selectedGrade || !selectedType || selectedTopics.length === 0) return;
    if (!isSignedIn) {
      // Optionally show a message or redirect to sign in
      alert("Please sign in to generate worksheets");
      return;
    }
    setShowGenerator(true);
  };

  const getCurrentTopics = (): Topic[] => {
    if (!gradeTopics || !selectedType) return [];

    switch (selectedType) {
      case "grammar":
        return gradeTopics.grammar;
      case "vocabulary":
        return gradeTopics.vocabulary;
      case "readingComprehension":
        return gradeTopics.readingComprehension;
      default:
        return [];
    }
  };

  // Show role selector for new users
  if (isSignedIn && showRoleSelector && user?.id) {
    return <RoleSelector userId={user.id} onRoleSelected={handleRoleSelected} />;
  }

  // Show dashboard if user has selected role and wants to view dashboard
  if (isSignedIn && userRole && showDashboard && user?.id) {
    return <UserDashboard userId={user.id} userRole={userRole} />;
  }

  return (
    <div className="min-h-screen bg-background grid-pattern">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold glow-text">EduSheet AI</h1>
                <p className="text-sm text-muted-foreground">AI-Powered English Worksheet Generator</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="tech-border">
                <Zap className="h-3 w-3 mr-1" />
                K-12 Ready
              </Badge>
              <div className="flex items-center gap-2">
                {isSignedIn && userRole && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDashboard(!showDashboard)}
                    className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                  >
                    {showDashboard ? 'Worksheet Generator' : 'My Dashboard'}
                  </Button>
                )}
                <AuthButton />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 glow-text">
            Generate Custom English Worksheets
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create personalized grammar, vocabulary, and reading comprehension worksheets
            tailored to any K-12 grade level with AI-powered content generation.
          </p>
        </div>

        {/* Configuration Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Grade Selection */}
          <Card className="tech-card tech-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Select Grade Level
              </CardTitle>
              <CardDescription>
                Choose the appropriate grade level for your worksheet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger className="tech-border">
                  <SelectValue placeholder="Select grade..." />
                </SelectTrigger>
                <SelectContent>
                  {grades.map(grade => (
                    <SelectItem key={grade} value={grade}>
                      {grade === "K" ? "Kindergarten" : `Grade ${grade}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Worksheet Type Selection */}
          <Card className="tech-card tech-hover lg:col-span-2">
            <CardHeader>
              <CardTitle>Choose Worksheet Type</CardTitle>
              <CardDescription>
                Select the type of English skills to focus on
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {worksheetTypes.map(type => (
                  <Button
                    key={type.id}
                    variant={selectedType === type.id ? "default" : "outline"}
                    className={`h-auto p-4 flex flex-col items-center space-y-2 tech-hover ${
                      selectedType === type.id ? "glow-border" : "tech-border"
                    }`}
                    onClick={() => setSelectedType(type.id)}
                  >
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${type.color} text-white`}>
                      {type.icon}
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{type.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {type.description}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Topics Selection */}
        {selectedGrade && selectedType && (
          <Card className="tech-card mb-8">
            <CardHeader>
              <CardTitle>Select Topics</CardTitle>
              <CardDescription>
                Choose specific topics to include in your worksheet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getCurrentTopics().map(topic => (
                  <Button
                    key={topic.id}
                    variant={selectedTopics.includes(topic.id) ? "default" : "outline"}
                    className={`h-auto p-4 text-left tech-hover ${
                      selectedTopics.includes(topic.id) ? "glow-border" : "tech-border"
                    }`}
                    onClick={() => handleTopicToggle(topic.id)}
                  >
                    <div>
                      <div className="font-semibold">{topic.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {topic.description}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generate Button */}
        {selectedGrade && selectedType && selectedTopics.length > 0 && (
          <div className="text-center">
            <Button
              size="lg"
              onClick={handleGenerateWorksheet}
              disabled={isGenerating}
              className="px-8 py-4 text-lg glow-border tech-hover"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Generating Worksheet...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate AI Worksheet
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Selected: {selectedTopics.length} topic{selectedTopics.length !== 1 ? 's' : ''} •
              Grade {selectedGrade === "K" ? "K" : selectedGrade} •
              {worksheetTypes.find(t => t.id === selectedType)?.title}
            </p>
          </div>
        )}

        {/* Features Preview */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-center mb-8 glow-text">
            Powerful Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "AI-Generated Content",
                description: "Unique worksheets every time",
                icon: <Brain className="h-8 w-8" />
              },
              {
                title: "Grade-Appropriate",
                description: "Tailored to K-12 standards",
                icon: <Target className="h-8 w-8" />
              },
              {
                title: "Multiple Formats",
                description: "PDF, print-ready layouts",
                icon: <FileText className="h-8 w-8" />
              },
              {
                title: "Instant Generation",
                description: "Ready in seconds",
                icon: <Zap className="h-8 w-8" />
              }
            ].map((feature) => (
              <Card key={feature.title} className="tech-card tech-hover text-center">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                      {feature.icon}
                    </div>
                  </div>
                  <h4 className="font-semibold mb-2">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Worksheet Generator Modal */}
      {showGenerator && (
        <WorksheetGenerator
          grade={selectedGrade}
          type={selectedType}
          topics={selectedTopics}
          onClose={() => setShowGenerator(false)}
          userId={user?.id || ""}
        />
      )}
    </div>
  );
}
