"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, BookOpen, Check, CheckCircle, Clock, Download, FileText, RefreshCw, Save, Send, X, XCircle } from 'lucide-react';
import { AIWorksheetGenerator } from "@/lib/ai-generator";
import { saveStudentProgress, type StudentAnswer, type WorksheetQuestion } from "@/lib/database";

interface InteractiveWorksheetProps {
  userId?: string;
  worksheetId?: string;
  title: string;
  instructions: string;
  questions: WorksheetQuestion[];
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit?: number;
  showHints: boolean;
  allowRetries: boolean;
  onComplete?: (score: number, answers: StudentAnswer[]) => void;
}

export function InteractiveWorksheet({
  userId,
  worksheetId,
  title,
  instructions,
  questions,
  difficulty,
  timeLimit,
  showHints,
  allowRetries,
  onComplete
}: InteractiveWorksheetProps) {
  // State for user answers
  const [userAnswers, setUserAnswers] = useState<Record<string, string | string[]>>({});
  const [questionStatus, setQuestionStatus] = useState<Record<string, 'unanswered' | 'answered' | 'correct' | 'incorrect'>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(timeLimit ? timeLimit * 60 : null);
  const [isTimerActive, setIsTimerActive] = useState(!!timeLimit);
  const [startTime] = useState<Date>(new Date());
  
  // Initialize question status
  useEffect(() => {
    const initialStatus: Record<string, 'unanswered' | 'answered' | 'correct' | 'incorrect'> = {};
    questions.forEach(q => {
      initialStatus[q.id] = 'unanswered';
    });
    setQuestionStatus(initialStatus);
  }, [questions]);
  
  // Timer functionality
  useEffect(() => {
    if (!isTimerActive || timeRemaining === null) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          setIsTimerActive(false);
          // Auto-submit when time is up
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isTimerActive, timeRemaining]);
  
  // Format time remaining
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  // Handle answer change
  const handleAnswerChange = (questionId: string, answer: string | string[]) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    
    setQuestionStatus(prev => ({
      ...prev,
      [questionId]: 'answered'
    }));
  };
  
  // Handle multiple choice selection
  const handleMultipleChoiceSelect = (questionId: string, option: string) => {
    handleAnswerChange(questionId, option);
  };
  
  // Handle submit
  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setIsGrading(true);
    
    try {
      // Calculate time spent
      const endTime = new Date();
      const timeSpentSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      
      // Prepare answers for grading
      const answersForGrading = questions.map(question => {
        const userAnswer = userAnswers[question.id] || '';
        return {
          questionId: question.id,
          question: question.question,
          userAnswer,
          correctAnswer: question.correctAnswer,
          type: question.type
        };
      });
      
      // Grade using AI
      const aiGrader = new AIWorksheetGenerator();
      const gradingResult = await aiGrader.gradeWorksheet({
        answers: answersForGrading,
        difficulty
      });
      
      // Process grading results
      const newStatus: Record<string, 'unanswered' | 'answered' | 'correct' | 'incorrect'> = {};
      const newFeedback: Record<string, string> = {};
      
      let totalScore = 0;
      let totalPoints = 0;
      
      gradingResult.gradedAnswers.forEach(gradedAnswer => {
        newStatus[gradedAnswer.questionId] = gradedAnswer.isCorrect ? 'correct' : 'incorrect';
        newFeedback[gradedAnswer.questionId] = gradedAnswer.feedback;
        
        if (gradedAnswer.isCorrect) {
          const question = questions.find(q => q.id === gradedAnswer.questionId);
          totalScore += question?.points || 0;
        }
        
        // Add up total possible points
        const question = questions.find(q => q.id === gradedAnswer.questionId);
        totalPoints += question?.points || 0;
      });
      
      // Calculate percentage score
      const percentageScore = totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0;
      
      setQuestionStatus(newStatus);
      setFeedback(newFeedback);
      setScore(percentageScore);
      
      // Save progress if userId is provided
      if (userId && worksheetId) {
        const studentAnswers: StudentAnswer[] = gradingResult.gradedAnswers.map(gradedAnswer => ({
          questionId: gradedAnswer.questionId,
          answer: userAnswers[gradedAnswer.questionId] || '',
          isCorrect: gradedAnswer.isCorrect,
          timeSpent: timeSpentSeconds / questions.length // Approximate time per question
        }));
        
        await saveStudentProgress({
          userId,
          worksheetId,
          score: percentageScore,
          totalQuestions: questions.length,
          timeSpent: timeSpentSeconds,
          completedAt: new Date(),
          answers: studentAnswers
        });
        
        // Call onComplete callback if provided
        if (onComplete) {
          onComplete(percentageScore, studentAnswers);
        }
      }
    } catch (error) {
      console.error('Error grading worksheet:', error);
      // Fallback manual grading
      const newStatus: Record<string, 'unanswered' | 'answered' | 'correct' | 'incorrect'> = {};
      const newFeedback: Record<string, string> = {};
      
      let totalCorrect = 0;
      
      questions.forEach(question => {
        const userAnswer = userAnswers[question.id] || '';
        const isCorrect = Array.isArray(question.correctAnswer)
          ? question.correctAnswer.includes(userAnswer.toString())
          : userAnswer.toString().toLowerCase() === question.correctAnswer.toString().toLowerCase();
        
        newStatus[question.id] = isCorrect ? 'correct' : 'incorrect';
        newFeedback[question.id] = isCorrect 
          ? 'Correct!' 
          : `Incorrect. The correct answer is: ${question.correctAnswer}`;
        
        if (isCorrect) totalCorrect++;
      });
      
      const percentageScore = Math.round((totalCorrect / questions.length) * 100);
      
      setQuestionStatus(newStatus);
      setFeedback(newFeedback);
      setScore(percentageScore);
    } finally {
      setIsSubmitting(false);
      setIsGrading(false);
      setIsTimerActive(false);
    }
  };
  
  // Handle retry
  const handleRetry = () => {
    // Reset answers and status
    setUserAnswers({});
    
    const initialStatus: Record<string, 'unanswered' | 'answered' | 'correct' | 'incorrect'> = {};
    questions.forEach(q => {
      initialStatus[q.id] = 'unanswered';
    });
    
    setQuestionStatus(initialStatus);
    setScore(null);
    setFeedback({});
    
    // Reset timer if applicable
    if (timeLimit) {
      setTimeRemaining(timeLimit * 60);
      setIsTimerActive(true);
    }
  };
  
  // Calculate progress
  const answeredCount = Object.values(questionStatus).filter(
    status => status !== 'unanswered'
  ).length;
  
  const progress = (answeredCount / questions.length) * 100;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>
                {difficulty === 'easy' 
                  ? 'Basic concepts and fundamentals' 
                  : difficulty === 'medium' 
                    ? 'Intermediate concepts and application' 
                    : 'Advanced concepts and critical thinking'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {timeRemaining !== null && (
                <Badge 
                  variant={timeRemaining > 60 ? "outline" : "destructive"} 
                  className="flex items-center gap-1"
                >
                  <Clock className="h-3 w-3" />
                  {formatTime(timeRemaining)}
                </Badge>
              )}
              <Badge variant="outline" className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {questions.length} Questions
              </Badge>
              {score !== null && (
                <Badge 
                  variant={score >= 70 ? "default" : score >= 50 ? "secondary" : "destructive"}
                  className="flex items-center gap-1"
                >
                  {score >= 70 ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  Score: {score}%
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-1">Instructions</h3>
            <p className="text-sm text-muted-foreground">{instructions}</p>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={progress} className="flex-1" />
            <span className="text-xs text-muted-foreground">
              {answeredCount}/{questions.length} answered
            </span>
          </div>
        </CardContent>
      </Card>
      
      {/* Questions */}
      <div className="space-y-6">
        {questions.map((question, index) => (
          <Card 
            key={question.id} 
            className={`
              transition-all duration-200
              ${questionStatus[question.id] === 'correct' ? 'border-green-500 shadow-green-100' : ''}
              ${questionStatus[question.id] === 'incorrect' ? 'border-red-500 shadow-red-100' : ''}
            `}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">
                  {index + 1}. {question.question}
                </CardTitle>
                <div className="flex items-center">
                  {questionStatus[question.id] === 'correct' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {questionStatus[question.id] === 'incorrect' && (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <Badge variant="outline" className="ml-2">
                    {question.points} {question.points === 1 ? 'point' : 'points'}
                  </Badge>
                </div>
              </div>
              {showHints && question.explanation && score === null && (
                <CardDescription className="mt-1">
                  <span className="font-medium">Hint:</span> {question.explanation}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {/* Multiple Choice */}
              {question.type === 'multiple-choice' && question.options && (
                <div className="grid gap-2">
                  {question.options.map((option, optionIndex) => (
                    <div 
                      key={optionIndex}
                      className={`
                        flex items-center p-3 rounded-md border cursor-pointer transition-all
                        ${userAnswers[question.id] === option && score === null ? 'border-primary bg-primary/5' : 'border-input'}
                        ${score !== null && option === question.correctAnswer ? 'border-green-300 bg-green-50/30' : ''}
                        ${score !== null && userAnswers[question.id] === option && option !== question.correctAnswer ? 'border-red-300 bg-red-50/30' : ''}
                        ${score === null ? 'hover:bg-accent hover:text-accent-foreground' : ''}
                      `}
                      onClick={() => score === null && handleMultipleChoiceSelect(question.id, option)}
                    >
                      <div className="flex-1">{option}</div>
                      {score !== null && option === question.correctAnswer && (
                        <div className="flex items-center justify-center h-5 w-5 rounded-full bg-green-100 text-green-600">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                      {score !== null && userAnswers[question.id] === option && option !== question.correctAnswer && (
                        <div className="flex items-center justify-center h-5 w-5 rounded-full bg-red-100 text-red-600">
                          <X className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Fill in the blank */}
              {question.type === 'fill-blank' && (
                <Input
                  placeholder="Your answer..."
                  value={(userAnswers[question.id] || '') as string}
                  onChange={(e) => score === null && handleAnswerChange(question.id, e.target.value)}
                  disabled={score !== null}
                  className={`
                    ${score !== null && questionStatus[question.id] === 'correct' ? 'border-green-500 text-green-700' : ''}
                    ${score !== null && questionStatus[question.id] === 'incorrect' ? 'border-red-500 text-red-700' : ''}
                  `}
                />
              )}
              
              {/* Short answer */}
              {question.type === 'short-answer' && (
                <Textarea
                  placeholder="Your answer..."
                  value={(userAnswers[question.id] || '') as string}
                  onChange={(e) => score === null && handleAnswerChange(question.id, e.target.value)}
                  disabled={score !== null}
                  className={`
                    ${score !== null && questionStatus[question.id] === 'correct' ? 'border-green-500 text-green-700' : ''}
                    ${score !== null && questionStatus[question.id] === 'incorrect' ? 'border-red-500 text-red-700' : ''}
                  `}
                  rows={3}
                />
              )}
              
              {/* Essay */}
              {question.type === 'essay' && (
                <Textarea
                  placeholder="Your answer..."
                  value={(userAnswers[question.id] || '') as string}
                  onChange={(e) => score === null && handleAnswerChange(question.id, e.target.value)}
                  disabled={score !== null}
                  className={`
                    ${score !== null && questionStatus[question.id] === 'correct' ? 'border-green-500 text-green-700' : ''}
                    ${score !== null && questionStatus[question.id] === 'incorrect' ? 'border-red-500 text-red-700' : ''}
                  `}
                  rows={6}
                />
              )}
              
              {/* Feedback (shown after submission) */}
              {score !== null && feedback[question.id] && (
                <div className={`
                  mt-3 p-3 rounded-md text-sm border
                  ${questionStatus[question.id] === 'correct' ? 'border-green-300 bg-green-50/50 text-green-700' : 'border-red-300 bg-red-50/50 text-red-700'}
                `}>
                  <div className="flex items-center gap-2">
                    {questionStatus[question.id] === 'correct' ? (
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    )}
                    <span>{feedback[question.id]}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Actions */}
      <div className="flex justify-between items-center">
        <div>
          {score !== null && allowRetries && (
            <Button 
              variant="outline" 
              onClick={handleRetry}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {score === null && (
            <Button
              variant="default"
              onClick={handleSubmit}
              disabled={isSubmitting || answeredCount === 0}
              className="flex items-center gap-2"
            >
              {isGrading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                  Grading...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Answers
                </>
              )}
            </Button>
          )}
          {score !== null && userId && (
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => window.print()}
            >
              <Save className="h-4 w-4" />
              Save Worksheet
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
