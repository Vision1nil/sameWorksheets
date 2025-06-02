"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Target, Brain, FileText, BookOpen } from "lucide-react";
import { getAllGrades, getGradeTopics, type Topic } from "@/lib/topics";
import { useUser } from "@clerk/nextjs";

interface GeneratorFormProps {
  onGenerateWorksheet: (config: WorksheetConfig) => void;
  isGenerating: boolean;
}

export interface WorksheetConfig {
  grade: string;
  type: string;
  topics: string[];
  questionTypes: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  questionsCount: number;
  includeAnswerKey: boolean;
  timeLimit: number;
  showHints: boolean;
  allowRetries: boolean;
}

// Define question types constant
const questionTypes = [
  { id: 'multiple-choice', name: 'Multiple Choice' },
  { id: 'fill-blank', name: 'Fill in the Blank' },
  { id: 'short-answer', name: 'Short Answer' },
  { id: 'long-answer', name: 'Long Answer' },
  { id: 'essay', name: 'Essay' }
];

export function GeneratorForm({ onGenerateWorksheet, isGenerating }: GeneratorFormProps) {
  const { isSignedIn } = useUser();
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<string[]>(['multiple-choice']);
  const [formState, setFormState] = useState<Partial<WorksheetConfig>>({
    difficulty: 'medium',
    questionsCount: 5,
    includeAnswerKey: true,
    timeLimit: 10,
    showHints: true,
    allowRetries: true,
  });
  const [draftKey, setDraftKey] = useState<string | null>(null);

  const grades = getAllGrades();
  const gradeTopics = selectedGrade ? getGradeTopics(selectedGrade) : null;

  // Auto-save draft
  useEffect(() => {
    if (!isSignedIn || !selectedGrade || !selectedType) return;
    
    const key = `worksheet_draft_${selectedGrade}_${selectedType}`;
    setDraftKey(key);
    
    // Load draft if exists
    const savedDraft = localStorage.getItem(key);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setSelectedTopics(draft.topics || []);
        setFormState(prev => ({
          ...prev,
          ...draft
        }));
      } catch (e) {
        console.error("Error loading draft:", e);
      }
    }
  }, [isSignedIn, selectedGrade, selectedType]);

  // Save draft when form changes
  useEffect(() => {
    if (!draftKey || !selectedGrade || !selectedType) return;
    
    const draftData = {
      grade: selectedGrade,
      type: selectedType,
      topics: selectedTopics,
      ...formState
    };
    
    localStorage.setItem(draftKey, JSON.stringify(draftData));
  }, [draftKey, selectedGrade, selectedType, selectedTopics, formState]);

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
    setSelectedTopics(prev => {
      if (prev.includes(topicId)) {
        return prev.filter(id => id !== topicId);
      } else {
        return [...prev, topicId];
      }
    });
  };

  const handleQuestionTypeToggle = (typeId: string) => {
    setSelectedQuestionTypes(prev => {
      if (prev.includes(typeId)) {
        // Don't allow deselecting the last question type
        if (prev.length === 1) return prev;
        return prev.filter(id => id !== typeId);
      } else {
        return [...prev, typeId];
      }
    });
  };

  const handleGenerateWorksheet = () => {
    if (!selectedGrade || !selectedType || selectedTopics.length === 0) return;
    
    onGenerateWorksheet({
      grade: selectedGrade,
      type: selectedType,
      topics: selectedTopics,
      questionTypes: selectedQuestionTypes,
      difficulty: formState.difficulty as 'easy' | 'medium' | 'hard',
      questionsCount: formState.questionsCount || 5,
      includeAnswerKey: formState.includeAnswerKey || true,
      timeLimit: formState.timeLimit || 10,
      showHints: formState.showHints || true,
      allowRetries: formState.allowRetries || true,
    });
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Grade Selection */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Grade Level</Label>
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger className="border border-gray-800 bg-black/20 hover:bg-black/30 transition-all">
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
        </div>

        {/* Difficulty Level - Simplified */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Difficulty</Label>
          <div className="grid grid-cols-3 gap-2">
            {['easy', 'medium', 'hard'].map((level) => (
              <Button
                key={level}
                type="button"
                variant={formState.difficulty === level ? "default" : "outline"}
                size="sm"
                className={`${formState.difficulty === level ? "bg-gradient-to-r from-blue-500 to-purple-500" : "border border-gray-800 bg-black/20"}`}
                onClick={() => setFormState(prev => ({ ...prev, difficulty: level as 'easy' | 'medium' | 'hard' }))}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Worksheet Type Selection - Simplified */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Worksheet Type</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {worksheetTypes.map(type => (
            <Button
              key={type.id}
              variant={selectedType === type.id ? "default" : "outline"}
              className={`h-auto py-3 px-4 flex items-center gap-3 justify-start ${selectedType === type.id ? "bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-500" : "border border-gray-800 bg-black/20"}`}
              onClick={() => setSelectedType(type.id)}
            >
              <div className={`p-1.5 rounded-full bg-gradient-to-r ${type.color}`}>
                {type.icon}
              </div>
              <div>
                <h3 className="font-medium text-left">{type.title}</h3>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Topics Selection - Simplified */}
      {selectedGrade && selectedType && (
        <div className="mt-6">
          <Label className="text-sm font-medium mb-2 block">Topics to Include</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-4 border border-gray-800 rounded-lg bg-black/10">
            {getCurrentTopics().map(topic => (
              <div key={topic.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`topic-${topic.id}`}
                  checked={selectedTopics.includes(topic.id)}
                  onCheckedChange={() => handleTopicToggle(topic.id)}
                />
                <Label
                  htmlFor={`topic-${topic.id}`}
                  className="text-sm cursor-pointer"
                >
                  {topic.name}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Question Types Selection */}
      {selectedGrade && selectedType && (
        <div className="mt-6">
          <Label className="text-sm font-medium mb-2 block">Question Types</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 border border-gray-800 rounded-lg bg-black/10">
            {questionTypes.map(type => (
              <div key={type.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`qtype-${type.id}`}
                  checked={selectedQuestionTypes.includes(type.id)}
                  onCheckedChange={() => handleQuestionTypeToggle(type.id)}
                />
                <Label
                  htmlFor={`qtype-${type.id}`}
                  className="text-sm cursor-pointer"
                >
                  {type.name}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Options - Simplified */}
      {selectedGrade && selectedType && selectedTopics.length > 0 && (
        <div className="mt-6 p-4 border border-gray-800 rounded-lg bg-black/10">
          <h3 className="text-sm font-medium mb-4">Additional Options</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Questions Count */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">Number of Questions</Label>
                  <Badge variant="outline">{formState.questionsCount}</Badge>
                </div>
                <Slider
                  value={[formState.questionsCount || 5]}
                  min={3}
                  max={15}
                  step={1}
                  onValueChange={(value) => setFormState(prev => ({ ...prev, questionsCount: value[0] }))}
                />
              </div>
              
              {/* Time Limit */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">Time Limit (minutes)</Label>
                  <Badge variant="outline">{formState.timeLimit}</Badge>
                </div>
                <Slider
                  value={[formState.timeLimit || 10]}
                  min={5}
                  max={60}
                  step={5}
                  onValueChange={(value) => setFormState(prev => ({ ...prev, timeLimit: value[0] }))}
                />
              </div>
            </div>
            
            {/* Right Column - Checkboxes */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-answer-key"
                  checked={formState.includeAnswerKey}
                  onCheckedChange={(checked) => 
                    setFormState(prev => ({ ...prev, includeAnswerKey: checked === true }))
                  }
                />
                <Label htmlFor="include-answer-key" className="text-sm">Include Answer Key</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-hints"
                  checked={formState.showHints}
                  onCheckedChange={(checked) => 
                    setFormState(prev => ({ ...prev, showHints: checked === true }))
                  }
                />
                <Label htmlFor="show-hints" className="text-sm">Show Hints</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allow-retries"
                  checked={formState.allowRetries}
                  onCheckedChange={(checked) => 
                    setFormState(prev => ({ ...prev, allowRetries: checked === true }))
                  }
                />
                <Label htmlFor="allow-retries" className="text-sm">Allow Retries</Label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <Button
        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all mt-6"
        size="lg"
        disabled={!selectedGrade || !selectedType || selectedTopics.length === 0 || isGenerating}
        onClick={handleGenerateWorksheet}
      >
        {isGenerating ? "Generating..." : "Generate Worksheet"}
      </Button>
    </div>
  );
}
