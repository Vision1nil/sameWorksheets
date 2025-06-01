"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Download, Eye, RefreshCw, Share, Star, Save } from "lucide-react";
import { DifficultySelector, type DifficultyLevel } from "./DifficultySelector";
import { PDFGenerator, type WorksheetData } from "@/lib/pdf-generator";
import { saveWorksheet, type SavedWorksheet, type WorksheetQuestion, type DifficultySettings } from "@/lib/database";

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
  const [difficultyConfig, setDifficultyConfig] = useState({
    level: 'medium' as DifficultyLevel,
    questionsCount: 10,
    includeAnswerKey: true,
    timeLimit: 30,
    showHints: false,
    allowRetries: true
  });

  // Mock worksheet generation - replace with actual AI API integration
  const generateWorksheet = async (): Promise<GeneratedWorksheet> => {
    const worksheetTypes = {
      grammar: "Grammar Practice",
      vocabulary: "Vocabulary Builder",
      readingComprehension: "Reading Comprehension"
    };

    const gradeLevel = grade === "K" ? "Kindergarten" : `Grade ${grade}`;

    // Mock questions based on type
    const mockQuestions = {
      grammar: [
        {
          id: 1,
          type: "multiple-choice" as const,
          question: "Which word is a noun in this sentence: 'The cat ran quickly'?",
          options: ["cat", "ran", "quickly", "the"],
          answer: "cat"
        },
        {
          id: 2,
          type: "fill-blank" as const,
          question: "Complete the sentence: The dog _____ in the park.",
          answer: "played"
        },
        {
          id: 3,
          type: "short-answer" as const,
          question: "Write a sentence using the word 'beautiful'.",
          answer: "Sample: The beautiful flower bloomed in the garden."
        }
      ],
      vocabulary: [
        {
          id: 1,
          type: "multiple-choice" as const,
          question: "What does the word 'enormous' mean?",
          options: ["very small", "very large", "colorful", "fast"],
          answer: "very large"
        },
        {
          id: 2,
          type: "fill-blank" as const,
          question: "The _____ elephant walked slowly through the jungle.",
          answer: "enormous"
        },
        {
          id: 3,
          type: "short-answer" as const,
          question: "Use the word 'magnificent' in a sentence.",
          answer: "Sample: The magnificent castle stood on the hill."
        }
      ],
      readingComprehension: [
        {
          id: 1,
          type: "multiple-choice" as const,
          question: "What is the main idea of the passage?",
          options: ["Animals in the forest", "The changing seasons", "Friendship", "Adventure"],
          answer: "Friendship"
        },
        {
          id: 2,
          type: "short-answer" as const,
          question: "How did the main character solve the problem?",
          answer: "Sample: The character asked for help from friends."
        },
        {
          id: 3,
          type: "essay" as const,
          question: "Explain why the story's ending was satisfying. Use examples from the text.",
          answer: "Sample: Students should provide specific examples and personal reflection."
        }
      ]
    };

    return {
      title: `${worksheetTypes[type as keyof typeof worksheetTypes]} - ${gradeLevel}`,
      instructions: "Complete all questions to the best of your ability. Show your work where applicable.",
      questions: mockQuestions[type as keyof typeof mockQuestions] || [],
      answerKey: {
        1: mockQuestions[type as keyof typeof mockQuestions]?.[0]?.answer || "",
        2: mockQuestions[type as keyof typeof mockQuestions]?.[1]?.answer || "",
        3: mockQuestions[type as keyof typeof mockQuestions]?.[2]?.answer || "",
      }
    };
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
      const worksheetData: WorksheetData = {
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
      
      const worksheetQuestions: WorksheetQuestion[] = worksheet.questions.map(q => ({
        id: q.id.toString(),
        type: q.type as 'multiple-choice' | 'fill-blank' | 'short-answer' | 'essay',
        question: q.question,
        options: q.options,
        correctAnswer: q.answer || '',
        points: q.type === 'essay' ? 10 : q.type === 'short-answer' ? 5 : 2
      }));
      
      const settings: DifficultySettings = {
        questionCount: difficultyConfig.questionsCount,
        timeLimit: difficultyConfig.timeLimit,
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

      alert('Worksheet saved successfully!');
    } catch (error) {
      console.error('Error saving worksheet:', error);
      alert('Error saving worksheet. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = () => {
    setWorksheet(null);
    handleGenerate();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto tech-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 glow-text">
            <Star className="h-5 w-5" />
            Worksheet Generator
          </DialogTitle>
          <DialogDescription>
            AI-powered worksheet generation for Grade {grade === "K" ? "K" : grade} • {type}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Difficulty Configuration */}
          {!worksheet && (
            <DifficultySelector
              grade={grade}
              type={type}
              config={difficultyConfig}
              onChange={setDifficultyConfig}
            />
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
              {worksheet && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAnswerKey(!showAnswerKey)}
                    className="tech-border"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {showAnswerKey ? "Hide" : "Show"} Answers
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerate}
                    className="tech-border"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Regenerate
                  </Button>
                  {userId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveWorksheet}
                      disabled={isSaving}
                      className="tech-border"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="tech-border"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download PDF
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Worksheet Content */}
          {!worksheet ? (
            <Card className="tech-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Generating Your Worksheet</h3>
                    <p className="text-muted-foreground text-center">
                      Our AI is creating a custom worksheet based on your selections...
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold mb-2">Ready to Generate</h3>
                    <p className="text-muted-foreground text-center mb-6">
                      Click the button below to create your custom worksheet
                    </p>
                    <Button onClick={handleGenerate} size="lg" className="glow-border">
                      <Star className="h-5 w-5 mr-2" />
                      Generate Worksheet
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Worksheet Header */}
              <Card className="tech-card">
                <CardHeader>
                  <CardTitle className="text-center text-2xl">{worksheet.title}</CardTitle>
                  <CardDescription className="text-center">
                    Name: ___________________ Date: ___________
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center font-medium">{worksheet.instructions}</p>
                </CardContent>
              </Card>

              {/* Questions */}
              <div className="space-y-4">
                {worksheet.questions.map((question, index) => (
                  <Card key={question.id} className="tech-card">
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
                                {question.options.map((option, optIndex) => (
                                  <div key={`${question.id}-${option}`} className="flex items-center gap-2">
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
                                className="min-h-32 tech-border"
                                disabled
                              />
                            )}

                            {showAnswerKey && (
                              <div className="mt-3 p-3 bg-primary/10 rounded-md">
                                <p className="text-sm font-medium text-primary">
                                  Answer: {question.answer}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
