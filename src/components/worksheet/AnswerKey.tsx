"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

interface AnswerKeyProps {
  questions: {
    id: number;
    type: string;
    question: string;
    options?: string[];
    answer?: string;
    correctAnswer?: string | string[];
    points?: number;
  }[];
  answerKey: Record<number, string>;
  userAnswers?: Record<number, string>;
  showCorrectness?: boolean;
}

export function AnswerKey({ questions, answerKey, userAnswers, showCorrectness = false }: AnswerKeyProps) {
  // Filter out reading passages
  const actualQuestions = questions.filter(q => !q.question.includes("READING_PASSAGE:"));
  
  return (
    <Card className="border border-gray-800 bg-black/20">
      <CardHeader className="pb-3 border-b border-gray-800">
        <CardTitle className="text-lg flex items-center">
          <Badge className="mr-2 bg-gradient-to-r from-green-500 to-emerald-500">Answer Key</Badge>
          Answer Key
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {actualQuestions.map((question, index) => {
            const questionNumber = index + 1;
            const correctAnswer = answerKey[question.id] || question.correctAnswer || question.answer || '';
            const userAnswer = userAnswers?.[question.id] || '';
            const isCorrect = userAnswer && correctAnswer && 
              typeof correctAnswer === 'string' && 
              userAnswer.toLowerCase() === correctAnswer.toLowerCase();
            
            return (
              <div key={question.id} className="pb-3 border-b border-gray-800 last:border-0">
                <div className="flex items-start">
                  <div className="font-medium mr-2">{questionNumber}.</div>
                  <div className="flex-1">
                    <div className="mb-2 font-medium">{question.question}</div>
                    
                    {/* Display correct answer based on question type */}
                    {question.type === 'multiple-choice' && question.options ? (
                      <div className="text-sm text-emerald-400 font-medium">
                        <div>Correct Answer: {correctAnswer}</div>
                        <div className="mt-1">
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className={`flex items-center ${option === correctAnswer ? 'text-emerald-400' : 'text-gray-500'}`}>
                              <span className="mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                              <span>{option}</span>
                              {option === correctAnswer && <CheckCircle2 className="h-3 w-3 ml-1" />}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : question.type === 'essay' ? (
                      <div>
                        <div className="text-sm text-emerald-400 font-medium mb-2">Evaluation Criteria:</div>
                        <div className="mt-2 p-2 bg-gray-900/50 border border-gray-800 rounded-md text-sm space-y-1">
                          <div><span className="font-medium">Content (40%):</span> Addresses all aspects of the prompt</div>
                          <div><span className="font-medium">Organization (30%):</span> Clear structure with logical flow</div>
                          <div><span className="font-medium">Evidence (20%):</span> Uses specific examples to support claims</div>
                          <div><span className="font-medium">Language (10%):</span> Uses appropriate vocabulary and grammar</div>
                        </div>
                        {correctAnswer && (
                          <div className="mt-2 p-2 bg-gray-900/50 border border-gray-800 rounded-md">
                            <div className="text-xs text-gray-400 mb-1">Sample Response:</div>
                            <div className="text-sm whitespace-pre-line">{correctAnswer}</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-emerald-400 font-medium">
                        Correct Answer: {correctAnswer}
                      </div>
                    )}
                    
                    {/* Display user answer if available */}
                    {userAnswer && showCorrectness && (
                      <div className="mt-3 flex items-center p-2 bg-gray-900/30 rounded-md">
                        <div className="text-sm text-gray-300 mr-2 flex-1">
                          <span className="font-medium">Your Answer:</span> {userAnswer}
                        </div>
                        {isCorrect ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
