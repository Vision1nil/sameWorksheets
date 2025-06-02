"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AIGeneratedWorksheet } from "@/lib/ai-generator";
import { saveWorksheet, saveStudentProgress, StudentAnswer } from "@/lib/database";
import { aiService, WorksheetRequest } from "@/lib/ai-service";
import { PDFGenerator } from "@/lib/pdf-generator";
import { Topic, getGradeTopics } from "@/lib/topics";
import { InteractiveWorksheet } from "./InteractiveWorksheet";
import { Loader2, Download, Save, RefreshCw, Eye, EyeOff, FileText, Send, Clock, CheckCircle, AlertCircle, Star } from "lucide-react";

interface WorksheetGeneratorProps {
  grade: string;
  type: string;
  topics: string[];
  onClose: () => void;
  userId?: string;
}

interface GeneratedWorksheet {
  title: string;
  instructions: string;
  questions: Array<{
    id: number;
    type: "multiple-choice" | "fill-blank" | "short-answer" | "essay";
    question: string;
    options?: string[];
    answer?: string;
  }>;
  answerKey: Record<number, string>;
}

export function WorksheetGenerator({ grade, type, topics, onClose, userId }: WorksheetGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [worksheet, setWorksheet] = useState<GeneratedWorksheet | null>(null);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("preview");
  const [saveNotification, setSaveNotification] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({show: false, message: '', type: 'success'});
  const [difficultyConfig, setDifficultyConfig] = useState<{
    level: 'easy' | 'medium' | 'hard';
    questionsCount: number;
    includeAnswerKey: boolean;
    timeLimit: number;
    showHints: boolean;
    allowRetries: boolean;
  }>({
    level: 'medium',
    questionsCount: 5,
    includeAnswerKey: true,
    timeLimit: 10, // Default 10 minutes time limit for interactive mode
    showHints: true,
    allowRetries: true,
  });

  // AI-powered worksheet generation using optimized AI service
  const generateWorksheet = async (): Promise<GeneratedWorksheet> => {
    try {
      // Get the topics data for the selected grade and type
      const gradeTopics = getGradeTopics(grade);
      if (!gradeTopics) {
        throw new Error(`Topics not found for grade ${grade}`);
      }
      
      // Get the selected topics data
      const topicsKey = type as keyof typeof gradeTopics;
      const topicsArray = gradeTopics[topicsKey];
      
      if (!Array.isArray(topicsArray)) {
        throw new Error(`Invalid topics data for grade ${grade} and type ${type}`);
      }

      // Filter and type the selected topics
      const selectedTopics = topicsArray.filter((topic: Topic) => topics.includes(topic.id));

      // Prepare the worksheet request
      const request: WorksheetRequest = {
        grade,
        type: type as 'grammar' | 'vocabulary' | 'readingComprehension',
        topics: selectedTopics,
        difficulty: difficultyConfig.level,
        questionCount: difficultyConfig.questionsCount,
        includeAnswerKey: difficultyConfig.includeAnswerKey,
        timeLimit: difficultyConfig.timeLimit,
        showHints: difficultyConfig.showHints,
        allowRetries: difficultyConfig.allowRetries
      };

      // Generate worksheet using the optimized AI service
      const result = await aiService.generateWorksheet(request);
      
      // Create answer key
      const answerKey: Record<number, string> = {};
      result.questions.forEach((q: { answer?: string }, index: number) => {
        answerKey[index + 1] = q.answer || '';
      });
      
      // Transform the result to match our expected format
      return {
        title: result.title,
        instructions: result.instructions,
        questions: result.questions.map((q: {
          type: string;
          question: string;
          options?: string[];
          answer?: string;
        }, index: number) => ({
          id: index + 1,
          type: q.type as 'multiple-choice' | 'fill-blank' | 'short-answer' | 'essay',
          question: q.question,
          options: q.options,
          answer: q.answer
        })),
        answerKey
      };
    } catch (error) {
      console.error('Error generating worksheet with AI:', error);
      
      // Fallback to basic template if AI generation fails
      const worksheetTypes = {
        grammar: "Grammar Practice",
        vocabulary: "Vocabulary Builder",
        readingComprehension: "Reading Comprehension"
      };

      const gradeLevel = grade === "K" ? "Kindergarten" : `Grade ${grade}`;
      
      return {
        title: `${worksheetTypes[type as keyof typeof worksheetTypes]} - ${gradeLevel}`,
        instructions: "Complete all questions to the best of your ability. Show your work where applicable.",
        questions: [
          {
            id: 1,
            type: "multiple-choice" as const,
            question: "Sample question (AI generation failed)",
            options: ["Option A", "Option B", "Option C", "Option D"],
            answer: "Option A"
          }
        ],
        answerKey: { 1: "Option A" }
      };
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      const generatedWorksheet = await generateWorksheet();
      setWorksheet(generatedWorksheet);
    } catch (error) {
      console.error("Error generating worksheet:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!worksheet) return;

    try {
      const worksheetData: any = {
        title: worksheet.title,
        grade,
        type: type as 'grammar' | 'vocabulary' | 'readingComprehension',
        topics,
        instructions: worksheet.instructions,
        questions: worksheet.questions.map(q => ({
          ...q,
          points: q.type === 'essay' ? 10 : q.type === 'short-answer' ? 5 : 2
        })),
        difficulty: difficultyConfig.level,
        includeAnswerKey: difficultyConfig.includeAnswerKey
      };

      const pdfGenerator = new PDFGenerator();
      await pdfGenerator.generateWorksheetPDF(worksheetData);

      // Increment download count if worksheet is saved
      // This would be implemented when we have the worksheet ID
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const handleSaveWorksheet = async () => {
    if (!worksheet || !userId) return;

    try {
      setIsSaving(true);
      
      const worksheetQuestions: any[] = worksheet.questions.map(q => ({
        id: q.id.toString(),
        type: q.type as 'multiple-choice' | 'fill-blank' | 'short-answer' | 'essay',
        question: q.question,
        options: q.options,
        correctAnswer: q.answer || '',
        points: q.type === 'essay' ? 10 : q.type === 'short-answer' ? 5 : 2
      }));
      
      const settings: any = {
        questionCount: difficultyConfig.questionsCount,
        timeLimit: difficultyConfig.timeLimit || 0, // Provide a default value of 0 if timeLimit is undefined
        showAnswerKey: difficultyConfig.includeAnswerKey,
        allowHints: difficultyConfig.showHints,
        allowRetries: difficultyConfig.allowRetries
      };
      
      await saveWorksheet({
        userId,
        title: worksheet.title,
        grade,
        type: type as 'grammar' | 'vocabulary' | 'readingComprehension',
        topics,
        difficulty: difficultyConfig.level,
        questions: worksheetQuestions,
        settings
      });

      // Show success notification
      setSaveNotification({
        show: true,
        message: 'Worksheet saved successfully!',
        type: 'success'
      });
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setSaveNotification(prev => ({ ...prev, show: false }));
      }, 5000);
    } catch (error) {
      console.error('Error saving worksheet:', error);
      
      // Show error notification
      setSaveNotification({
        show: true,
        message: 'Error saving worksheet. Please try again.',
        type: 'error'
      });
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setSaveNotification(prev => ({ ...prev, show: false }));
      }, 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = () => {
    setWorksheet(null);
    handleGenerate();
  };
  
  // Handle completion of interactive worksheet
  const [completionStatus, setCompletionStatus] = useState<{
    completed: boolean;
    score: number | null;
  }>({
    completed: false,
    score: null
  });

  const handleWorksheetComplete = (score: number, answers: StudentAnswer[]) => {
    if (!userId || !worksheet) return;
    
    // Save student progress to database
    saveStudentProgress({
      userId,
      worksheetId: `temp_${Date.now()}`,
      score,
      totalQuestions: worksheet.questions.length,
      timeSpent: difficultyConfig.timeLimit || 0,
      completedAt: new Date(),
      answers
    });
    
    // Update completion status
    setCompletionStatus({
      completed: true,
      score: score
    });
    
    // Show toast or notification
    console.log(`Worksheet completed with score: ${score}%`);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      {/* Side notification */}
      {saveNotification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg flex items-center justify-between max-w-sm transition-all duration-300 ${saveNotification.type === 'success' ? 'bg-green-100 border border-green-300 text-green-800' : 'bg-red-100 border border-red-300 text-red-800'}`}>
          <div className="flex items-center">
            {saveNotification.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
            )}
            <p>{saveNotification.message}</p>
          </div>
          <button 
            onClick={() => setSaveNotification(prev => ({ ...prev, show: false }))}
            className="ml-4 text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto tech-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 glow-text">
            <FileText className="h-5 w-5" />
            Worksheet Generator
          </DialogTitle>
          <DialogDescription>
            AI-powered worksheet generation for Grade {grade === "K" ? "K" : grade} • {type}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Difficulty Configuration */}
          {!worksheet && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select
                    value={difficultyConfig.level}
                    onValueChange={(value: 'easy' | 'medium' | 'hard') => 
                      setDifficultyConfig({
                        ...difficultyConfig,
                        level: value
                      })
                    }
                  >
                    <SelectTrigger id="difficulty">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="questions">Number of Questions</Label>
                  <Select
                    value={difficultyConfig.questionsCount.toString()}
                    onValueChange={(value: string) => 
                      setDifficultyConfig({
                        ...difficultyConfig,
                        questionsCount: parseInt(value)
                      })
                    }
                  >
                    <SelectTrigger id="questions">
                      <SelectValue placeholder="Select count" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Questions</SelectItem>
                      <SelectItem value="5">5 Questions</SelectItem>
                      <SelectItem value="10">10 Questions</SelectItem>
                      <SelectItem value="15">15 Questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                  <Select
                    value={difficultyConfig.timeLimit.toString()}
                    onValueChange={(value: string) => 
                      setDifficultyConfig({
                        ...difficultyConfig,
                        timeLimit: parseInt(value)
                      })
                    }
                  >
                    <SelectTrigger id="timeLimit">
                      <SelectValue placeholder="Select time limit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No Time Limit</SelectItem>
                      <SelectItem value="5">5 Minutes</SelectItem>
                      <SelectItem value="10">10 Minutes</SelectItem>
                      <SelectItem value="15">15 Minutes</SelectItem>
                      <SelectItem value="30">30 Minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="answerKey" 
                      checked={difficultyConfig.includeAnswerKey}
                      onCheckedChange={(checked: boolean) => 
                        setDifficultyConfig({
                          ...difficultyConfig,
                          includeAnswerKey: checked
                        })
                      }
                    />
                    <Label
                      htmlFor="answerKey"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Include Answer Key
                    </Label>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="showHints" 
                      checked={difficultyConfig.showHints}
                      onCheckedChange={(checked: boolean) => 
                        setDifficultyConfig({
                          ...difficultyConfig,
                          showHints: checked
                        })
                      }
                    />
                    <Label
                      htmlFor="showHints"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Show Hints
                    </Label>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="allowRetries" 
                      checked={difficultyConfig.allowRetries}
                      onCheckedChange={(checked: boolean) => 
                        setDifficultyConfig({
                          ...difficultyConfig,
                          allowRetries: checked
                        })
                      }
                    />
                    <Label
                      htmlFor="allowRetries"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Allow Retries
                    </Label>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Generation Controls */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {topics.map(topic => (
                <Badge key={topic} variant="secondary" className="tech-border">
                  {topic}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              {!worksheet ? (
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="tech-border"
                >
                  {isGenerating ? "Generating..." : "Generate Worksheet"}
                </Button>
              ) : null}
            </div>
          </div>

          {/* Worksheet Display */}
          {worksheet && (
            <div className="mt-6">
              <Card className="tech-card mb-4">
                <CardHeader>
                  <CardTitle>{worksheet.title}</CardTitle>
                  <CardDescription>{worksheet.instructions}</CardDescription>
                </CardHeader>
              </Card>
              
              {/* Worksheet Display Tabs */}
              <Tabs defaultValue="preview" className="w-full">
                <TabsList className="mb-4 w-full">
                  <TabsTrigger value="preview" className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Preview Mode
                    </div>
                  </TabsTrigger>
                  <TabsTrigger value="interactive" className="flex-1">
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Interactive Mode
                    </div>
                  </TabsTrigger>
                </TabsList>
                
                {/* Action buttons */}
                <div className="flex items-center gap-2 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => setShowAnswerKey(!showAnswerKey)}
                  >
                    {showAnswerKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showAnswerKey ? "Hide Answers" : "Show Answers"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={handleRegenerate}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Regenerate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={handleSaveWorksheet}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Worksheet
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
                
                {/* Preview Tab */}
                <TabsContent value="preview" className="mt-4">
                  {worksheet?.questions.map((question: any, index: number) => (
                    <Card key={question.id} className="tech-card mb-4">
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <Badge variant="outline" className="shrink-0">
                              {index + 1}
                            </Badge>
                            <div className="flex-1">
                              <p className="font-medium mb-3">{question.question}</p>

                              {question.type === "multiple-choice" && question.options && (
                                <div className="space-y-2">
                                  {question.options.map((option: string, optIndex: number) => (
                                    <div key={`${question.id}-${optIndex}`} className="flex items-center gap-2">
                                      <div className="w-4 h-4 border border-border rounded-sm" />
                                      <span>{String.fromCharCode(65 + optIndex)}. {option}</span>
                                      {showAnswerKey && option === question.answer && (
                                        <Badge variant="default" className="ml-2">Correct</Badge>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {question.type === "fill-blank" && (
                                <div className="border-b border-border w-48 h-8 inline-block" />
                              )}

                              {question.type === "short-answer" && (
                                <div className="space-y-2">
                                  <div className="border-b border-border h-8" />
                                  <div className="border-b border-border h-8" />
                                  <div className="border-b border-border h-8" />
                                </div>
                              )}

                              {question.type === "essay" && (
                                <Textarea
                                  placeholder="Write your answer here..."
                                  className="min-h-[150px] tech-border"
                                  disabled
                                />
                              )}

                              {showAnswerKey && question.answer && question.type !== "multiple-choice" && (
                                <div className="mt-3 p-2 bg-muted/50 rounded-md">
                                  <span className="font-semibold">Answer:</span> {question.answer}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
                
                {/* Interactive Worksheet Tab */}
                <TabsContent value="interactive" className="mt-4">
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <h3 className="font-medium text-blue-700 mb-1">Interactive Worksheet Mode</h3>
                    <p className="text-sm text-blue-600">
                      Answer the questions directly on this page and submit your answers for AI-powered grading.
                      {difficultyConfig.timeLimit > 0 && ` You have ${difficultyConfig.timeLimit} minutes to complete this worksheet.`}
                    </p>
                  </div>
                  <InteractiveWorksheet
                    userId={userId}
                    worksheetId={`temp_${Date.now()}`}
                    title={worksheet?.title || ""}
                    instructions={worksheet?.instructions || ""}
                    questions={worksheet?.questions.map((q: any) => ({
                      id: q.id.toString(),
                      type: q.type,
                      question: q.question,
                      options: q.options || [],
                      correctAnswer: q.answer || '',
                      points: q.type === 'essay' ? 10 : q.type === 'short-answer' ? 5 : 2
                    }))}
                    difficulty={difficultyConfig.level}
                    timeLimit={difficultyConfig.timeLimit}
                    showHints={difficultyConfig.showHints}
                    allowRetries={difficultyConfig.allowRetries}
                    onComplete={handleWorksheetComplete}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
