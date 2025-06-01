"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Brain, Target, Zap, Settings } from "lucide-react";

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

interface DifficultyConfig {
  level: DifficultyLevel;
  questionsCount: number;
  includeAnswerKey: boolean;
  timeLimit?: number; // in minutes
  showHints: boolean;
  allowRetries: boolean;
}

interface DifficultySelectorProps {
  grade: string;
  type: string;
  config: DifficultyConfig;
  onChange: (config: DifficultyConfig) => void;
}

export function DifficultySelector({ grade, type, config, onChange }: DifficultySelectorProps) {
  const difficultyLevels = [
    {
      level: 'easy' as const,
      title: 'Easy',
      description: 'Basic concepts, simple questions, more guidance',
      icon: <Target className="h-5 w-5" />,
      color: 'from-green-500 to-emerald-500',
      questionsRange: [5, 10],
      timeRange: [15, 30]
    },
    {
      level: 'medium' as const,
      title: 'Medium',
      description: 'Standard difficulty, balanced challenge',
      icon: <Brain className="h-5 w-5" />,
      color: 'from-yellow-500 to-orange-500',
      questionsRange: [8, 15],
      timeRange: [20, 45]
    },
    {
      level: 'hard' as const,
      title: 'Hard',
      description: 'Advanced concepts, complex reasoning required',
      icon: <Zap className="h-5 w-5" />,
      color: 'from-red-500 to-pink-500',
      questionsRange: [10, 20],
      timeRange: [30, 60]
    }
  ];

  const selectedDifficulty = difficultyLevels.find(d => d.level === config.level);

  const handleDifficultyChange = (level: DifficultyLevel) => {
    const difficulty = difficultyLevels.find(d => d.level === level);
    if (difficulty) {
      onChange({
        ...config,
        level,
        questionsCount: Math.min(config.questionsCount, difficulty.questionsRange[1]),
        timeLimit: config.timeLimit || difficulty.timeRange[0]
      });
    }
  };

  const handleQuestionsCountChange = (value: number[]) => {
    onChange({
      ...config,
      questionsCount: value[0]
    });
  };

  const handleTimeLimitChange = (value: number[]) => {
    onChange({
      ...config,
      timeLimit: value[0]
    });
  };

  const toggleAnswerKey = () => {
    onChange({
      ...config,
      includeAnswerKey: !config.includeAnswerKey
    });
  };

  const toggleHints = () => {
    onChange({
      ...config,
      showHints: !config.showHints
    });
  };

  const toggleRetries = () => {
    onChange({
      ...config,
      allowRetries: !config.allowRetries
    });
  };

  return (
    <Card className="tech-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Difficulty & Settings
        </CardTitle>
        <CardDescription>
          Customize the challenge level and worksheet options
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Difficulty Level Selection */}
        <div>
          <h4 className="font-semibold mb-3">Difficulty Level</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {difficultyLevels.map(difficulty => (
              <Button
                key={difficulty.level}
                variant={config.level === difficulty.level ? "default" : "outline"}
                className={`h-auto p-4 flex flex-col items-center space-y-2 tech-hover ${
                  config.level === difficulty.level ? "glow-border" : "tech-border"
                }`}
                onClick={() => handleDifficultyChange(difficulty.level)}
              >
                <div className={`p-2 rounded-lg bg-gradient-to-r ${difficulty.color} text-white`}>
                  {difficulty.icon}
                </div>
                <div className="text-center">
                  <div className="font-semibold">{difficulty.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {difficulty.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Question Count */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Number of Questions</h4>
            <Badge variant="outline" className="tech-border">
              {config.questionsCount} questions
            </Badge>
          </div>
          <Slider
            value={[config.questionsCount]}
            onValueChange={handleQuestionsCountChange}
            max={selectedDifficulty?.questionsRange[1] || 20}
            min={selectedDifficulty?.questionsRange[0] || 5}
            step={1}
            className="tech-slider"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{selectedDifficulty?.questionsRange[0]} min</span>
            <span>{selectedDifficulty?.questionsRange[1]} max</span>
          </div>
        </div>

        {/* Time Limit */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Time Limit (optional)</h4>
            <Badge variant="outline" className="tech-border">
              {config.timeLimit ? `${config.timeLimit} min` : 'No limit'}
            </Badge>
          </div>
          <Slider
            value={[config.timeLimit || 0]}
            onValueChange={handleTimeLimitChange}
            max={selectedDifficulty?.timeRange[1] || 60}
            min={0}
            step={5}
            className="tech-slider"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>No limit</span>
            <span>{selectedDifficulty?.timeRange[1]} min max</span>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <h4 className="font-semibold">Worksheet Options</h4>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Include Answer Key</div>
              <div className="text-sm text-muted-foreground">
                Generate a separate answer key page
              </div>
            </div>
            <Switch
              checked={config.includeAnswerKey}
              onCheckedChange={toggleAnswerKey}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Show Hints</div>
              <div className="text-sm text-muted-foreground">
                Provide helpful hints for difficult questions
              </div>
            </div>
            <Switch
              checked={config.showHints}
              onCheckedChange={toggleHints}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Allow Retries</div>
              <div className="text-sm text-muted-foreground">
                Let students retake the worksheet if needed
              </div>
            </div>
            <Switch
              checked={config.allowRetries}
              onCheckedChange={toggleRetries}
            />
          </div>
        </div>

        {/* Difficulty Info */}
        {selectedDifficulty && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1 rounded bg-gradient-to-r ${selectedDifficulty.color} text-white`}>
                {selectedDifficulty.icon}
              </div>
              <h5 className="font-semibold">{selectedDifficulty.title} Level</h5>
            </div>
            <p className="text-sm text-muted-foreground">
              {getDifficultyDescription(selectedDifficulty.level, type, grade)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getDifficultyDescription(level: DifficultyLevel, type: string, grade: string): string {
  const gradeLevel = grade === 'K' ? 'Kindergarten' : `Grade ${grade}`;

  const descriptions = {
    easy: {
      grammar: `Basic ${type} concepts for ${gradeLevel}. Simple sentence structures and fundamental rules.`,
      vocabulary: `Common words and basic definitions appropriate for ${gradeLevel} reading level.`,
      readingComprehension: `Short passages with straightforward questions about main ideas and details.`
    },
    medium: {
      grammar: `Standard ${type} practice for ${gradeLevel}. Mix of simple and compound structures.`,
      vocabulary: `Age-appropriate vocabulary with context clues and word relationships.`,
      readingComprehension: `Moderate-length texts requiring inference and analysis skills.`
    },
    hard: {
      grammar: `Advanced ${type} concepts for ${gradeLevel}. Complex sentences and nuanced rules.`,
      vocabulary: `Challenging vocabulary requiring critical thinking and advanced comprehension.`,
      readingComprehension: `Complex texts with multi-layered questions requiring synthesis and evaluation.`
    }
  };

  return descriptions[level][type as keyof typeof descriptions.easy] ||
         `${level.charAt(0).toUpperCase() + level.slice(1)} level ${type} practice for ${gradeLevel}.`;
}
