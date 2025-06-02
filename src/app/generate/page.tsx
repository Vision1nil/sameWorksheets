"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GeneratorForm, type WorksheetConfig } from "@/components/worksheet/GeneratorForm";
import { PreviewPane } from "@/components/worksheet/PreviewPane";
import { aiService, WorksheetRequest } from "@/lib/ai-service";
import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

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

export default function GeneratePage() {
  const { isSignedIn, isLoaded } = useUser();
  const [isGenerating, setIsGenerating] = useState(false);
  const [worksheet, setWorksheet] = useState<GeneratedWorksheet | null>(null);
  const [config, setConfig] = useState<WorksheetConfig | null>(null);

  // Redirect to sign-in if not signed in
  if (isLoaded && !isSignedIn) {
    redirect("/sign-in");
  }

  const handleGenerateWorksheet = async (config: WorksheetConfig, forceRefresh: boolean = false) => {
    setIsGenerating(true);
    setConfig(config);
    
    try {
      // Generate worksheet using the AI service
      const request: WorksheetRequest = {
        grade: config.grade,
        type: config.type as 'grammar' | 'vocabulary' | 'readingComprehension',
        topics: config.topics.map(topicId => ({ id: topicId, name: topicId, description: `Topic for ${topicId}` })),
        questionTypes: config.questionTypes,
        difficulty: config.difficulty,
        questionCount: config.questionsCount,
        includeAnswerKey: config.includeAnswerKey,
        timeLimit: config.timeLimit,
        showHints: config.showHints,
        allowRetries: config.allowRetries
      };

      // Simulate API delay for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Call AI service with forceRefresh parameter to bypass cache if regenerating
      const result = await aiService.generateWorksheet(request, forceRefresh);
      
      // Create answer key
      const answerKey: Record<number, string> = {};
      result.questions.forEach((q: { answer?: string }, index: number) => {
        answerKey[index + 1] = q.answer || '';
      });
      
      // Transform the result to match our expected format
      const generatedWorksheet: GeneratedWorksheet = {
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
      
      setWorksheet(generatedWorksheet);
    } catch (error) {
      console.error("Error generating worksheet:", error);
      
      // Create a fallback worksheet if AI generation fails
      const fallbackWorksheet: GeneratedWorksheet = {
        title: `${config.type.charAt(0).toUpperCase() + config.type.slice(1)} Worksheet - Grade ${config.grade}`,
        instructions: "Complete all questions to the best of your ability.",
        questions: [
          {
            id: 1,
            type: "multiple-choice",
            question: "Sample question (AI generation failed)",
            options: ["Option A", "Option B", "Option C", "Option D"],
            answer: "Option A"
          }
        ],
        answerKey: { 1: "Option A" }
      };
      
      setWorksheet(fallbackWorksheet);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    if (config) {
      handleGenerateWorksheet(config);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Worksheet Generator</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Create custom worksheets tailored to your learning needs in just a few clicks.
        </p>
      </div>
      
      {/* Generator Form - Top */}
      <div className="mb-8">
        <Card className="border border-gray-800 bg-black/20 hover:bg-black/30 transition-all shadow-md hover:shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Configure Your Worksheet</CardTitle>
            <CardDescription>
              Select options below to customize your worksheet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GeneratorForm 
              onGenerateWorksheet={handleGenerateWorksheet}
              isGenerating={isGenerating}
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Preview Pane - Bottom */}
      <div>
        <Card className="border border-gray-800 bg-black/20 hover:bg-black/30 transition-all shadow-md hover:shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Worksheet Preview</CardTitle>
            <CardDescription>
              Your generated worksheet will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            {config && (
              <PreviewPane
                worksheet={worksheet}
                config={config}
                onRegenerate={() => handleGenerateWorksheet(config, true)}
                isGenerating={isGenerating}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
