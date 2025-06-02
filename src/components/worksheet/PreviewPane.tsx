"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Download, Eye, EyeOff, Save, RefreshCw } from "lucide-react";
import { PDFGenerator, WorksheetData, generatePDFFromHTML } from '@/lib/pdf-generator';
import { saveWorksheet, WorksheetQuestion } from "@/lib/database";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
// Answer key is now integrated directly in the component

type QuestionType = "multiple-choice" | "fill-blank" | "short-answer" | "essay" | "true-false";

interface Question {
  id: number;
  type: QuestionType;
  question: string;
  options?: string[];
  answer?: string;
  correctAnswer?: string | string[];
  points?: number;
}

interface PreviewPaneProps {
  worksheet: {
    title: string;
    instructions: string;
    questions: Question[];
    answerKey: Record<number, string>;
  } | null;
  config: {
    grade: string;
    type: string;
    topics: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    questionsCount: number;
    includeAnswerKey: boolean;
  };
  onRegenerate?: () => void;
  isGenerating: boolean;
}

interface GradingResult {
  isCorrect: boolean | null;
  needsReview: boolean;
  feedback: string;
  modelAnswer?: string;
}

interface WorksheetPDFData extends WorksheetData {
  answerKey?: Record<number, string>;
  userAnswers?: Record<number, string>;
  gradingResults?: Record<number, GradingResult>;
  score?: number | null;
}

export function PreviewPane({ worksheet, config, onRegenerate, isGenerating }: PreviewPaneProps) {
  const { user } = useUser();
  const router = useRouter();
  // Answer key is only shown when grading
  const [answersLocked, setAnswersLocked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [isGrading, setIsGrading] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [gradingResults, setGradingResults] = useState<Record<number, GradingResult>>({});
  const [showResults, setShowResults] = useState(false);
  const [saveNotification, setSaveNotification] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({
    show: false, 
    message: '', 
    type: 'success'
  });

  // Function to extract reading passages from questions
  function extractReadingPassages(questions: Question[]) {
    const passages: {passage: string, questions: Question[]}[] = [];
    let currentPassage = '';
    let currentQuestions: Question[] = [];
    
    questions.forEach(question => {
      // If question starts with "PASSAGE:" it's a new passage
      if (question.question.startsWith('PASSAGE:')) {
        // Save previous passage and its questions if they exist
        if (currentPassage && currentQuestions.length > 0) {
          passages.push({
            passage: currentPassage,
            questions: [...currentQuestions]
          });
          currentQuestions = [];
        }
        // Extract new passage text
        currentPassage = question.question.replace('PASSAGE:', '').trim();
      } else if (question.question.includes("READING_PASSAGE:")) {
        // Handle alternative format
        currentPassage = question.question.replace('READING_PASSAGE:', '').trim();
      } else {
        // It's a question related to the current passage
        currentQuestions.push(question);
      }
    });
    
    // Add the last passage and its questions
    if (currentPassage && currentQuestions.length > 0) {
      passages.push({
        passage: currentPassage,
        questions: [...currentQuestions]
      });
    }
    
    return passages;
  }

  // Split reading comprehension questions into passages and questions
  const readingPassages = config?.type === 'readingComprehension' && worksheet?.questions ? extractReadingPassages(worksheet.questions) : [];
  
  // Get regular questions (non-reading comprehension)
  const regularQuestions = worksheet?.questions ? 
    (config?.type !== 'readingComprehension' ? 
      worksheet.questions.filter(q => !q.question.includes("READING_PASSAGE:") && !q.question.startsWith("PASSAGE:")) : 
      worksheet.questions.filter(q => !q.question.includes("READING_PASSAGE:") && !q.question.startsWith("PASSAGE:"))) : [];

  // Function to handle user answer changes
  const handleAnswerChange = (questionId: number, answer: string) => {
    // Don't allow changes if answers are locked (after grading)
    if (answersLocked) return;
    
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    
    // Reset grading when answers change
    if (score !== null) {
      setScore(null);
      setGradingResults({});
      setShowResults(false);
    }
  };

  // Function to handle worksheet saving
  const handleSaveWorksheet = async () => {
    if (!worksheet || !user) return;
    
    setIsSaving(true);
    try {
      // Convert questions to match WorksheetQuestion interface
      const dbQuestions: WorksheetQuestion[] = worksheet.questions.map(q => {
        // Ensure we have a correct answer for each question
        let correctAnswer = q.answer || '';
        
        // Try to get the answer from different possible sources
        if (!correctAnswer && q.correctAnswer) {
          correctAnswer = Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer;
          // Save it back to q.answer for future use
          q.answer = correctAnswer;
        }
        
        // Fallback to worksheet answer key if still no answer
        if (!correctAnswer && worksheet.answerKey && worksheet.answerKey[q.id]) {
          correctAnswer = worksheet.answerKey[q.id];
          // Save it back to q.answer for future use
          q.answer = correctAnswer;
        }
        
        return {
          id: q.id.toString(),
          type: q.type === 'true-false' ? 'multiple-choice' : q.type,
          question: q.question,
          options: q.options || [],
          correctAnswer: correctAnswer,
          points: q.points || (q.type === 'essay' ? 10 : q.type === 'short-answer' ? 5 : 2)
        };
      });
      
      // Create settings object required by SavedWorksheet
      const settings = {
        questionCount: config.questionsCount,
        timeLimit: 60,
        showAnswerKey: config.includeAnswerKey, // Keep this for backward compatibility
        allowHints: false,
        allowRetries: true
      };
      
      const worksheetId = await saveWorksheet({
        userId: user.id,
        title: worksheet.title,
        grade: config.grade,
        type: config.type as "readingComprehension" | "grammar" | "vocabulary",
        difficulty: config.difficulty,
        topics: config.topics,
        questions: dbQuestions,
        settings: settings,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      setSaveNotification({
        show: true,
        message: "Worksheet saved successfully!",
        type: 'success'
      });
      
      // Redirect to the worksheet page
      setTimeout(() => {
        router.push(`/worksheets/${worksheetId}`);
      }, 1500);
    } catch (error) {
      console.error("Error saving worksheet:", error);
      setSaveNotification({
        show: true,
        message: "Error saving worksheet. Please try again.",
        type: 'error'
      });
    } finally {
      setIsSaving(false);
      
      // Hide notification after 3 seconds
      setTimeout(() => {
        setSaveNotification(prev => ({ ...prev, show: false }));
      }, 3000);
    }
  };

  // Function to handle worksheet grading
  const handleGradeWorksheet = () => {
    if (!worksheet) return;
    
    setIsGrading(true);
    setShowResults(true);
    setAnswersLocked(true);
    
    // Calculate score
    let correctCount = 0;
    const newGradingResults: Record<number, GradingResult> = {};
    
    worksheet.questions.forEach(q => {
      // Skip reading passages
      if (q.question.includes("READING_PASSAGE:") || q.question.startsWith("PASSAGE:")) return;
      
      const userAnswer = userAnswers[q.id] || '';
      let correctAnswer = q.answer || '';
      
      // Try to get the answer from different possible sources
      if (!correctAnswer && q.correctAnswer) {
        correctAnswer = Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer;
        // Save it back to q.answer for future use
        q.answer = correctAnswer;
      }
      
      // Fallback to worksheet answer key if still no answer
      if (!correctAnswer && worksheet.answerKey && worksheet.answerKey[q.id]) {
        correctAnswer = worksheet.answerKey[q.id];
        // Save it back to q.answer for future use
        q.answer = correctAnswer;
      }
      
      if (!correctAnswer) {
        // No correct answer available
        newGradingResults[q.id] = {
          isCorrect: null,
          needsReview: true,
          feedback: "Unable to grade: No correct answer available. This question needs manual review."
        };
        return;
      }
      
      // Skip grading if no user answer
      if (!userAnswer) {
        newGradingResults[q.id] = {
          isCorrect: false,
          needsReview: false,
          feedback: "No answer provided."
        };
        return; // Skip further grading for this question
      }
      
      // Handle different question types
      if (q.type === 'multiple-choice' || q.type === 'true-false') {
        const isCorrect = userAnswer === correctAnswer;
        newGradingResults[q.id] = {
          isCorrect,
          needsReview: false,
          feedback: isCorrect ? "Correct!" : `Incorrect. The correct answer is: ${correctAnswer}`
        };
        
        if (isCorrect) correctCount++;
      } 
      else if (q.type === 'fill-blank') {
        // Basic string comparison for fill-in-the-blank
        const isCorrect = userAnswer.toLowerCase().trim() === (correctAnswer as string).toLowerCase().trim();
        newGradingResults[q.id] = {
          isCorrect,
          needsReview: false,
          feedback: isCorrect ? "Correct!" : `Incorrect. The correct answer is: ${correctAnswer}`
        };
        
        if (isCorrect) correctCount++;
      }
      else if (q.type === 'short-answer') {
        // For short answer, check if key terms are included
        const keyTerms = Array.isArray(correctAnswer) ? 
          correctAnswer.join(',').split(',').map(term => term.trim().toLowerCase()) :
          (correctAnswer as string).split(',').map(term => term.trim().toLowerCase());
        const userAnswerLower = userAnswer.toLowerCase();
        
        const matchedTerms = keyTerms.filter(term => userAnswerLower.includes(term));
        const isCorrect = matchedTerms.length >= Math.ceil(keyTerms.length * 0.7); // 70% match threshold
        
        newGradingResults[q.id] = {
          isCorrect,
          needsReview: true,
          feedback: isCorrect ? 
            "Your answer contains key elements. Good job!" : 
            "Your answer is missing some key elements. Consider including: " + keyTerms.join(', ')
        };
        
        if (isCorrect) correctCount++;
      }
      else if (q.type === 'essay') {
        // Provide detailed essay feedback
        const wordCount = userAnswer.split(/\s+/).filter(word => word.length > 0).length;
        const minWordCount = 100; // Minimum expected word count
        
        // Check for minimum word count
        if (wordCount < minWordCount) {
          newGradingResults[q.id] = {
            isCorrect: null,
            needsReview: true,
            feedback: `Your essay is too short (${wordCount} words). A good response should be at least ${minWordCount} words.`,
            modelAnswer: "Focus on developing your ideas more fully with specific examples and analysis."
          };
        } else {
          // Simple keyword-based assessment for essays
          const keyTerms = Array.isArray(correctAnswer) ? 
            correctAnswer.join(',').split(',').map(term => term.trim().toLowerCase()) :
            (correctAnswer ? (correctAnswer as string).split(',') : "thesis,evidence,analysis,conclusion".split(',')).map(term => term.trim().toLowerCase());
          
          const userAnswerLower = userAnswer.toLowerCase();
          const matchedTerms = keyTerms.filter(term => userAnswerLower.includes(term));
          const termMatchRatio = keyTerms.length > 0 ? matchedTerms.length / keyTerms.length : 0;
          
          // Provide feedback based on matched terms
          newGradingResults[q.id] = {
            isCorrect: null, // Essays don't have binary correct/incorrect
            needsReview: true,
            feedback: termMatchRatio > 0.7 ?
              "Your essay addresses most of the key points expected in a strong response. Good work!" :
              termMatchRatio > 0.4 ?
              "Your essay addresses some key concepts but could be more comprehensive." :
              "Your essay is missing many important elements. Review the sample response for guidance.",
            modelAnswer: "A strong essay should include a clear thesis, supporting evidence, critical analysis, and a conclusion that synthesizes your main points."
          };
        }
      }
    });
    
    // Calculate score (excluding questions that need review)
    const totalGradedQuestions = Object.values(newGradingResults).filter(r => r.isCorrect !== null).length;
    const correctGradedQuestions = Object.values(newGradingResults).filter(r => r.isCorrect === true).length;
    const calculatedScore = totalGradedQuestions > 0 ? 
      Math.round((correctGradedQuestions / totalGradedQuestions) * 100) : null;
    
    setGradingResults(newGradingResults);
    setScore(calculatedScore);
    setIsGrading(false);
  };

  // Function to download worksheet as PDF
  const handleDownloadPDF = async () => {
    if (!worksheet) return;
    
    // Create a temporary div to render the worksheet content
    const tempDiv = document.createElement('div');
    tempDiv.className = 'pdf-container p-8 bg-white text-black';
    tempDiv.style.width = '210mm'; // A4 width
    
    // Add worksheet title and metadata
    const titleDiv = document.createElement('div');
    titleDiv.innerHTML = `
      <h1 class="text-2xl font-bold mb-2">${worksheet.title}</h1>
      <div class="flex space-x-2 mb-4">
        <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">Grade ${config.grade}</span>
        <span class="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">${config.type}</span>
        <span class="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">${config.difficulty}</span>
      </div>
      <div class="mb-4 p-4 border rounded bg-gray-50">
        <h2 class="font-semibold mb-2">Instructions:</h2>
        <p>${worksheet.instructions}</p>
      </div>
    `;
    tempDiv.appendChild(titleDiv);
    
    // Add answer key if enabled and results are being shown
    if (config.includeAnswerKey && showResults) {
      const answerKeyDiv = document.createElement('div');
      answerKeyDiv.className = 'mb-6 p-4 border border-green-200 rounded-md bg-green-50';
      answerKeyDiv.innerHTML = `
        <h2 class="text-lg font-bold mb-3 text-green-800">Answer Key</h2>
        <div class="space-y-3">
          ${worksheet.questions.map((q, index) => {
            if (q.question.includes("READING_PASSAGE:")) return '';
            const questionNumber = index + 1;
            const correctAnswer = q.answer || worksheet.answerKey[q.id] || '';
            
            return `
              <div class="pb-2 border-b border-green-200 last:border-0">
                <div class="flex items-start">
                  <div class="font-medium mr-2">${questionNumber}.</div>
                  <div>
                    <div class="mb-1 font-medium">${q.question}</div>
                    <div class="text-sm text-green-700 font-medium">
                      Correct Answer: ${correctAnswer}
                    </div>
                    ${q.type === 'essay' ? `
                      <div class="mt-2 text-xs text-gray-600">
                        <div>Evaluation Criteria:</div>
                        <ul class="list-disc pl-5">
                          <li>Content (40%): Addresses all aspects of the prompt</li>
                          <li>Organization (30%): Clear structure with logical flow</li>
                          <li>Evidence (20%): Uses specific examples to support claims</li>
                          <li>Language (10%): Uses appropriate vocabulary and grammar</li>
                        </ul>
                      </div>
                    ` : ''}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
      tempDiv.appendChild(answerKeyDiv);
    }
    
    // Add questions with answers if available
    const questionsDiv = document.createElement('div');
    questionsDiv.className = 'space-y-4';
    
    worksheet.questions.forEach((q, index) => {
      if (q.question.includes("READING_PASSAGE:")) {
        // Add reading passage
        const passageDiv = document.createElement('div');
        passageDiv.className = 'mb-6 p-4 border rounded bg-gray-50';
        passageDiv.innerHTML = `
          <h2 class="font-semibold mb-2">Reading Passage:</h2>
          <p>${q.question.replace("READING_PASSAGE:", "").trim()}</p>
        `;
        questionsDiv.appendChild(passageDiv);
        return;
      }
      
      const questionDiv = document.createElement('div');
      questionDiv.className = 'p-4 border rounded';
      
      // Question text
      const questionText = document.createElement('p');
      questionText.className = 'font-medium mb-2';
      questionText.textContent = `${index + 1}. ${q.question}`;
      questionDiv.appendChild(questionText);
      
      // Question type specific content
      if (q.type === 'multiple-choice' && q.options) {
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'space-y-2 ml-4';
        
        q.options.forEach((option, optIndex) => {
          const optionDiv = document.createElement('div');
          const isCorrect = option === (q.answer || worksheet.answerKey[q.id]);
          const isUserSelected = option === userAnswers[q.id];
          
          optionDiv.innerHTML = `
            <span class="${isUserSelected ? 'font-medium' : ''} ${showResults && isCorrect ? 'text-green-600' : ''}">• ${option}</span>
            ${showResults && isCorrect ? ' ✓' : ''}
            ${isUserSelected && showResults ? (gradingResults[q.id]?.isCorrect ? ' ✓' : ' ✗') : ''}
          `;
          optionsDiv.appendChild(optionDiv);
        });
        
        questionDiv.appendChild(optionsDiv);
      } else if (q.type === 'fill-blank' || q.type === 'short-answer' || q.type === 'essay') {
        // User answer if available
        if (userAnswers[q.id]) {
          const userAnswerDiv = document.createElement('div');
          userAnswerDiv.className = 'mt-2 p-2 border rounded bg-gray-50';
          userAnswerDiv.innerHTML = `
            <p class="text-sm font-medium">Your Answer:</p>
            <p class="whitespace-pre-line">${userAnswers[q.id]}</p>
          `;
          questionDiv.appendChild(userAnswerDiv);
        }
        
        // Sample answer if showing answer key
        if (showResults && (q.answer || worksheet.answerKey[q.id])) {
          const sampleAnswerDiv = document.createElement('div');
          sampleAnswerDiv.className = 'mt-2 p-2 border rounded bg-green-50';
          sampleAnswerDiv.innerHTML = `
            <p class="text-sm font-medium">${q.type === 'essay' ? 'Sample Response:' : 'Answer:'}</p>
            <p class="whitespace-pre-line">${q.answer || worksheet.answerKey[q.id]}</p>
          `;
          questionDiv.appendChild(sampleAnswerDiv);
        }
        
        // Feedback if available
        if (showResults && gradingResults[q.id]) {
          const feedbackDiv = document.createElement('div');
          feedbackDiv.className = 'mt-2 p-2 border rounded bg-yellow-50';
          feedbackDiv.innerHTML = `
            <p class="text-sm font-medium">Feedback:</p>
            <p>${gradingResults[q.id].feedback}</p>
          `;
          questionDiv.appendChild(feedbackDiv);
        }
      }
      
      questionsDiv.appendChild(questionDiv);
    });
    
    tempDiv.appendChild(questionsDiv);
    
    // Add score if available
    if (score !== null) {
      const scoreDiv = document.createElement('div');
      scoreDiv.className = 'mt-6 p-4 border rounded text-center';
      scoreDiv.innerHTML = `
        <h2 class="font-bold text-lg">Score: ${score}%</h2>
        <p class="${score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600'}">
          ${score >= 80 ? 'Excellent work!' : score >= 60 ? 'Good effort!' : 'Keep practicing!'}
        </p>
      `;
      tempDiv.appendChild(scoreDiv);
    }
    
    // Append to document temporarily, generate PDF, then remove
    document.body.appendChild(tempDiv);
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    
    try {
      // Use the standalone function for HTML to PDF conversion
      await generatePDFFromHTML('pdf-container', `${worksheet.title.replace(/\s+/g, '_')}_worksheet.pdf`);
    } catch (error) {
      console.error("Error downloading worksheet:", error);
    }
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(tempDiv);
    }, 1000);
  };

  // If no worksheet is available, show placeholder
  if (!worksheet) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-gray-700 rounded-lg">
        {isGenerating ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
            <h3 className="text-xl font-medium mb-2">Generating Worksheet</h3>
            <p className="text-muted-foreground max-w-md">
              Our AI is creating a custom worksheet based on your specifications. This may take a moment...
            </p>
          </>
        ) : (
          <>
            <div className="p-4 rounded-full bg-black/50 border border-gray-800 mb-4">
              <Eye className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium mb-2">Preview Area</h3>
            <p className="text-muted-foreground max-w-md">
              Configure your worksheet settings above and click "Generate Worksheet" to see a preview here.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Notification */}
      {saveNotification.show && (
        <div className={`p-3 mb-4 rounded-md ${
          saveNotification.type === 'success' 
            ? 'bg-green-500/20 border border-green-500/50 text-green-300' 
            : 'bg-red-500/20 border border-red-500/50 text-red-300'
        }`}>
          {saveNotification.message}
        </div>
      )}
      
      {/* Answer key is now integrated directly with questions */}
      
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGradeWorksheet}
            disabled={isGrading || Object.keys(userAnswers).length === 0}
            className="border border-gray-700 bg-black/20"
          >
            {isGrading ? (
              <>Grading...</>
            ) : showResults ? (
              <>
                <Eye className="h-4 w-4 mr-2" />
                View Results
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Grade Worksheet
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Reset all states before regenerating
              setUserAnswers({});
              setGradingResults({});
              setScore(null);
              setShowResults(false);
              setAnswersLocked(false);
              setIsGrading(false);
              // Call the regenerate function from props
              if (onRegenerate) onRegenerate();
            }}
            disabled={isGenerating}
            className="border border-gray-700 bg-black/20"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            className="border border-gray-700 bg-black/20"
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={handleSaveWorksheet}
            disabled={isSaving}
            className="bg-gradient-to-r from-blue-500 to-purple-500"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Worksheet"}
          </Button>
        </div>
      </div>
      {/* Worksheet Content */}
      <div className="flex-1 overflow-auto">
        <Card className="bg-white text-black">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{worksheet.title}</h2>
              <div className="flex space-x-2">
                <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                  Grade {config.grade}
                </Badge>
                <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                  {config.type}
                </Badge>
                <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                  {config.difficulty}
                </Badge>
              </div>
            </div>
            
            {/* Answer key is now shown only when grading */}
          </CardHeader>
          
          <CardContent>
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Instructions:</h3>
              <p>{worksheet.instructions}</p>
            </div>
            
            {/* Reading Comprehension Layout */}
            {config.type === 'readingComprehension' && readingPassages.length > 0 && (
              <div className="space-y-8">
                {readingPassages.map((item, index) => (
                  <div key={`passage-${index}`} className="space-y-6">
                    {/* Passage Section */}
                    <div className="p-4 border rounded-md bg-gray-50">
                      <h3 className="font-semibold mb-2">Passage {index + 1}</h3>
                      <p className="whitespace-pre-line">{item.passage}</p>
                    </div>
                    
                    {/* Questions for this passage */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Questions for Passage {index + 1}</h3>
                      {item.questions.map((q, qIndex) => (
                        <div key={q.id} className="p-4 border rounded-md">
                          <p className="font-medium mb-2">{qIndex + 1}. {q.question}</p>
                          
                          {q.type === 'multiple-choice' && q.options && (
                            <div className="space-y-2">
                              {q.options.map((option: string, optIndex: number) => (
                                <div key={optIndex} className="flex items-start">
                                  <div className="flex h-5 items-center">
                                    <input
                                      type="radio"
                                      id={`q${q.id}-opt${optIndex}`}
                                      name={`question-${q.id}`}
                                      value={option}
                                      checked={userAnswers[q.id] === option}
                                      onChange={() => handleAnswerChange(q.id, option)}
                                      className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                    />
                                  </div>
                                  <label
                                    htmlFor={`q${q.id}-opt${optIndex}`}
                                    className={`ml-2 block text-sm font-medium leading-6 ${
                                      showResults && gradingResults[q.id] && userAnswers[q.id] === option 
                                        ? gradingResults[q.id].isCorrect ? 'text-green-600' : 'text-red-600'
                                        : ''
                                    }`}
                                  >
                                    {option}
                                    {showResults && gradingResults[q.id] && option === (q.answer || worksheet.answerKey[q.id]) && (
                                      <span className="ml-2 text-green-600">(Correct)</span>
                                    )}
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Show grading feedback */}
                          {showResults && gradingResults[q.id] && (
                            <div className={`mt-2 p-2 rounded ${
                              gradingResults[q.id].isCorrect 
                                ? 'bg-green-50 text-green-700' 
                                : gradingResults[q.id].isCorrect === false 
                                  ? 'bg-red-50 text-red-700' 
                                  : 'bg-yellow-50 text-yellow-700'
                            }`}>
                              {gradingResults[q.id].feedback}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Regular Questions Layout */}
            {regularQuestions.length > 0 && (
              <div className="space-y-4">
                {regularQuestions.map((q, index) => (
                  <div key={q.id} className="p-4 border rounded-md">
                    <p className="font-medium mb-2">{index + 1}. {q.question}</p>
                    
                    {q.type === 'multiple-choice' && q.options && (
                      <div className="space-y-2">
                        {q.options.map((option: string, optIndex: number) => (
                          <div key={optIndex} className="flex items-start">
                            <div className="flex h-5 items-center">
                              <input
                                type="radio"
                                id={`q${q.id}-opt${optIndex}`}
                                name={`question-${q.id}`}
                                value={option}
                                checked={userAnswers[q.id] === option}
                                onChange={() => handleAnswerChange(q.id, option)}
                                className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                              />
                            </div>
                            <label
                              htmlFor={`q${q.id}-opt${optIndex}`}
                              className={`ml-2 block text-sm font-medium leading-6 ${
                                showResults && gradingResults[q.id] && userAnswers[q.id] === option 
                                  ? gradingResults[q.id].isCorrect ? 'text-green-600' : 'text-red-600'
                                  : ''
                              }`}
                            >
                              {option}
                              {showResults && gradingResults[q.id] && (
                                <>
                                  {option === (q.answer || (worksheet.answerKey && worksheet.answerKey[q.id])) ? (
                                    <span className="ml-2 text-green-600">(Correct Answer)</span>
                                  ) : userAnswers[q.id] === option && (
                                    <span className="ml-2 text-red-600">(Incorrect)</span>
                                  )}
                                </>
                              )}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {q.type === 'true-false' && (
                      <div className="space-y-2">
                        {['True', 'False'].map((option) => (
                          <div key={option} className="flex items-start">
                            <div className="flex h-5 items-center">
                              <input
                                type="radio"
                                id={`q${q.id}-${option}`}
                                name={`question-${q.id}`}
                                value={option}
                                checked={userAnswers[q.id] === option}
                                onChange={() => handleAnswerChange(q.id, option)}
                                className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                              />
                            </div>
                            <label
                              htmlFor={`q${q.id}-${option}`}
                              className={`ml-2 block text-sm font-medium leading-6 ${
                                showResults && gradingResults[q.id] && userAnswers[q.id] === option 
                                  ? gradingResults[q.id].isCorrect ? 'text-green-600' : 'text-red-600'
                                  : ''
                              }`}
                            >
                              {option}
                              {showResults && gradingResults[q.id] && (
                                <>
                                  {option === (q.answer || (worksheet.answerKey && worksheet.answerKey[q.id])) ? (
                                    <span className="ml-2 text-green-600">(Correct Answer)</span>
                                  ) : userAnswers[q.id] === option && (
                                    <span className="ml-2 text-red-600">(Incorrect)</span>
                                  )}
                                </>
                              )}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {q.type === 'fill-blank' && (
                      <div className="mt-2">
                        <input
                          type="text"
                          placeholder="Your answer..."
                          value={userAnswers[q.id] || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          className="w-full p-2 border rounded-md"
                        />
                        {showResults && gradingResults[q.id] && (
                          <div className="mt-1">
                            <span className="text-sm font-medium">Answer: </span>
                            <span className="text-green-600">{q.answer || (worksheet.answerKey && worksheet.answerKey[q.id]) || 'Not available'}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {q.type === 'short-answer' && (
                      <div className="mt-2">
                        <textarea
                          placeholder="Your answer..."
                          value={userAnswers[q.id] || ''}
                          onChange={(e) => {
                            handleAnswerChange(q.id, e.target.value);
                            // Auto-resize the textarea
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                          }}
                          className="w-full p-2 border rounded-md min-h-[80px] overflow-y-auto resize-none"
                          style={{ height: userAnswers[q.id] ? Math.min(80, userAnswers[q.id].length / 2) + 'px' : '80px' }}
                        />
                        {showResults && (
                          <div className="mt-2 p-2 bg-gray-50 rounded-md border">
                            <span className="text-sm font-medium">Sample Answer: </span>
                            <span className="text-green-600 whitespace-pre-line">{q.answer || (worksheet.answerKey && worksheet.answerKey[q.id]) || 'Sample answer not available'}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {q.type === 'essay' && (
                      <div className="mt-2">
                        <textarea
                          placeholder="Your essay..."
                          value={userAnswers[q.id] || ''}
                          onChange={(e) => {
                            handleAnswerChange(q.id, e.target.value);
                            // Auto-resize the textarea
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 400) + 'px';
                          }}
                          className="w-full p-2 border rounded-md min-h-[150px] overflow-y-auto resize-none"
                          style={{ height: userAnswers[q.id] ? Math.min(150, userAnswers[q.id].length / 2) + 'px' : '150px' }}
                        />
                        {showResults && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md border">
                            <h4 className="text-sm font-semibold mb-1">Sample Essay Response:</h4>
                            <p className="text-sm whitespace-pre-line">{q.answer || (worksheet.answerKey && worksheet.answerKey[q.id]) || 
                              "A well-structured essay should include an introduction that presents the main argument, body paragraphs with supporting evidence, and a conclusion that summarizes the key points. Remember to use specific examples from the text to support your analysis."}</p>
                            <h4 className="text-sm font-semibold mt-2 mb-1">Grading Rubric:</h4>
                            <ul className="text-sm list-disc pl-5 space-y-1">
                              <li><span className="font-medium">Content (40%):</span> Addresses all aspects of the prompt with relevant and insightful ideas</li>
                              <li><span className="font-medium">Organization (30%):</span> Clear structure with logical flow between paragraphs</li>
                              <li><span className="font-medium">Evidence (20%):</span> Uses specific examples and details to support claims</li>
                              <li><span className="font-medium">Language (10%):</span> Uses appropriate vocabulary and grammar</li>
                            </ul>
                          </div>
                        )}
                        {showResults && gradingResults[q.id] && (
                          <div className="mt-2 p-2 rounded bg-yellow-50 text-yellow-700">
                            <p className="font-medium">Essay Feedback:</p>
                            <p>{gradingResults[q.id].feedback}</p>
                            {gradingResults[q.id].modelAnswer && (
                              <div className="mt-1">
                                <p className="font-medium">Model Answer Highlights:</p>
                                <p className="text-sm">{gradingResults[q.id].modelAnswer}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Show grading feedback */}
                    {showResults && gradingResults[q.id] && (
                      <div className={`mt-2 p-2 rounded ${
                        gradingResults[q.id].isCorrect 
                          ? 'bg-green-50 text-green-700' 
                          : gradingResults[q.id].isCorrect === false 
                            ? 'bg-red-50 text-red-700' 
                            : 'bg-yellow-50 text-yellow-700'
                      }`}>
                        {gradingResults[q.id].feedback}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Grade Worksheet Button */}
            <div className="mt-8 flex flex-col items-center">
              {score !== null && (
                <div className="mb-4 text-center">
                  <Badge className={`text-lg px-4 py-2 ${
                    score >= 70 
                      ? 'bg-green-100 text-green-800 border-green-300' 
                      : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                  }`}>
                    Score: {score}%
                  </Badge>
                  <p className="mt-2 text-gray-600">
                    {score >= 90 ? 'Excellent work!' : 
                     score >= 70 ? 'Good job!' : 
                     score >= 50 ? 'Keep practicing!' : 
                     'You need more practice on this topic.'}
                  </p>
                </div>
              )}
              
              <Button 
                onClick={handleGradeWorksheet}
                disabled={isGrading || Object.keys(userAnswers).length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-md w-full max-w-xs"
              >
                {isGrading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Grading...
                  </>
                ) : (
                  'Grade Worksheet'
                )}
              </Button>
              
              <p className="mt-2 text-xs text-gray-500">
                Submit your answers for grading. You can retry as many times as you need.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}