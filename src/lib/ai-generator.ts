import { WorksheetQuestion } from './database';
import { Topic } from './topics';
import { GOOGLE_AI_STUDIO_API_KEY } from './env';

// Define the interface for the AI-generated worksheet
export interface AIGeneratedWorksheet {
  title: string;
  instructions: string;
  questions: WorksheetQuestion[];
  answerKey: Record<string, string>;
}

// Define the interface for the AI request
export interface AIWorksheetRequest {
  grade: string;
  type: 'grammar' | 'vocabulary' | 'readingComprehension';
  topics: Topic[];
  questionTypes?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  includeAnswerKey: boolean;
  timeLimit?: number;
  showHints: boolean;
  allowRetries: boolean;
}

// Define interfaces for grading functionality
export interface AIGradingRequest {
  answers: {
    questionId: string;
    question: string;
    userAnswer: string | string[];
    correctAnswer: string | string[];
    type: string;
  }[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface GradedAnswer {
  questionId: string;
  isCorrect: boolean;
  feedback: string;
  partialCredit?: number;
}

export interface AIGradingResponse {
  overallFeedback: string;
  gradedAnswers: GradedAnswer[];
  score: number;
}

// Google AI Studio API client
export class AIWorksheetGenerator {
  private apiKey: string;
  private apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  constructor() {
    // Get API key from environment variable
    this.apiKey = GOOGLE_AI_STUDIO_API_KEY;
    if (!this.apiKey) {
      console.warn('Google AI Studio API key not found in environment variables');
    }
  }

  /**
   * Generate a worksheet using Google AI Studio
   */
  async generateWorksheet(params: AIWorksheetRequest): Promise<AIGeneratedWorksheet> {
    try {
      if (!this.apiKey) {
        throw new Error('Google AI Studio API key is not configured');
      }

      const { grade, type, topics, difficulty, questionCount, includeAnswerKey } = params;
      
      // Format topics for the prompt
      const topicNames = topics.map(t => t.name).join(', ');
      
      // Create the prompt for the AI
      const prompt = this.createPrompt(params, topicNames);
      
      // Call the Google AI Studio API
      const response = await this.callGoogleAI(prompt);
      
      // Parse the AI response
      return this.parseResponse(response, type, includeAnswerKey);
    } catch (error) {
      console.error('Error generating worksheet with AI:', error);
      throw error;
    }
  }

  /**
   * Grade a worksheet using Google AI Studio
   */
  async gradeWorksheet(params: AIGradingRequest): Promise<AIGradingResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('Google AI Studio API key is not configured');
      }

      // Create the prompt for the AI
      const prompt = this.createGradingPrompt(params);
      
      // Call the Google AI Studio API
      const response = await this.callGoogleAI(prompt);
      
      // Parse the AI response
      return this.parseGradingResponse(response);
    } catch (error) {
      console.error('Error grading worksheet with AI:', error);
      throw new Error('Failed to grade worksheet with AI');
    }
  }
  
  /**
   * Call the Google AI Studio API with a prompt
   */
  private async callGoogleAI(prompt: string): Promise<string> {
    const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Google AI Studio API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  /**
   * Create a prompt for the AI based on the worksheet parameters
   */
  private createPrompt(params: AIWorksheetRequest, topicNames: string): string {
    const { grade, type, difficulty, questionCount, includeAnswerKey, questionTypes: requestedTypes, showHints, timeLimit } = params;
    const gradeLevel = grade === 'K' ? 'Kindergarten' : `Grade ${grade}`;
    
    const worksheetTypes = {
      grammar: "Grammar Practice",
      vocabulary: "Vocabulary Builder",
      readingComprehension: "Reading Comprehension"
    };
    
    const difficultyDescriptions = {
      easy: "basic understanding and recall",
      medium: "application and analysis",
      hard: "critical thinking and evaluation"
    };

    // STRICTLY use only the question types selected by the user
    let questionTypes: string[];
    
    // Map from UI question type IDs to AI prompt question types
    const typeMapping: Record<string, string> = {
      'multiple-choice': 'multiple-choice',
      'fill-blank': 'fill-blank',
      'short-answer': 'short-answer',
      'long-answer': 'short-answer',
      'essay': 'essay'
    };
    
    if (requestedTypes && requestedTypes.length > 0) {
      // Convert UI question types to AI prompt question types
      questionTypes = requestedTypes.map((qType: string) => typeMapping[qType] || qType);
    } else {
      // Fallback to default question types if none provided
      // This should rarely happen as the UI enforces at least one selection
      questionTypes = ["multiple-choice"];
    }

    return `
Create an educational worksheet for ${gradeLevel} students focusing on ${worksheetTypes[type]}.
Topics to cover: ${topicNames}
Difficulty level: ${difficulty} (${difficultyDescriptions[difficulty]})

Please generate ${questionCount} questions with the following specifications:
1. IMPORTANT: ONLY create questions of the following types: ${questionTypes.join(', ')}. DO NOT include any other question types.
2. For multiple-choice questions, provide 4 options with one correct answer
3. For fill-in-the-blank questions, provide the correct answer
4. For short-answer questions, provide a sample correct answer
5. For essay questions (if applicable), provide evaluation criteria
${includeAnswerKey ? '6. Include an answer key for all questions' : ''}
${showHints ? '7. Include hints or explanations for each question' : ''}
${timeLimit ? `8. This worksheet should take approximately ${timeLimit} minutes to complete` : ''}

Format your response as a JSON object with the following structure:
{
  "title": "Worksheet title",
  "instructions": "Clear instructions for students",
  "questions": [
    {
      "id": "1",
      "type": "multiple-choice",
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Why this is the correct answer",
      "points": 2
    },
    {
      "id": "2",
      "type": "fill-blank",
      "question": "Question with _____ blank",
      "correctAnswer": "the correct word",
      "explanation": "Why this is the correct answer",
      "points": 2
    }
    // Additional questions...
  ]
}
`;
  }

  /**
   * Create a prompt for grading worksheet answers
   */
  private createGradingPrompt(params: AIGradingRequest): string {
    const answersJson = JSON.stringify(params.answers, null, 2);
    
    return `Grade the following student answers for an educational worksheet.
    The difficulty level of this worksheet is ${params.difficulty}.
    
    Here are the questions and student answers in JSON format:
    ${answersJson}
    
    Please evaluate each answer and provide feedback. For multiple-choice and fill-in-the-blank questions, 
    the answers should match exactly. For short-answer and essay questions, evaluate based on content, 
    accuracy, and completeness.
    
    Please format your response as a JSON object with the following structure:
    {
      "overallFeedback": "General feedback about the student's performance",
      "gradedAnswers": [
        {
          "questionId": "question_id",
          "isCorrect": true/false,
          "feedback": "Specific feedback for this answer",
          "partialCredit": 0.75 // optional, between 0 and 1, for partial credit on essay/short answer
        }
        // more graded answers...
      ],
      "score": 85 // percentage score from 0-100
    }
    
    For ${params.difficulty} difficulty, be ${params.difficulty === 'easy' ? 'more lenient' : params.difficulty === 'medium' ? 'moderately strict' : 'very strict'} in your grading.
    `;
  }

  /**
   * Parse the AI response into a structured worksheet format
   */
  private parseResponse(
    text: string, 
    type: string,
    includeAnswerKey: boolean
  ): AIGeneratedWorksheet {
    try {
      // Find JSON content in the response
      const jsonMatch = text.match(/\{[\s\S]*\}/m);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }
      
      const jsonStr = jsonMatch[0];
      const data = JSON.parse(jsonStr);
      
      // Validate the parsed data
      if (!data.title || !data.instructions || !Array.isArray(data.questions)) {
        throw new Error('Invalid worksheet data format');
      }
      
      // Transform the questions to match our app's format
      const questions = data.questions.map((q: any, index: number) => ({
        id: q.id || (index + 1).toString(),
        type: q.type,
        question: q.question,
        options: q.options || [],
        correctAnswer: q.correctAnswer || '',
        explanation: q.explanation || '',
        points: q.points || this.getDefaultPoints(q.type)
      }));
      
      // Create answer key
      const answerKey: Record<string, string> = {};
      if (includeAnswerKey) {
        questions.forEach((q: WorksheetQuestion) => {
          answerKey[q.id] = Array.isArray(q.correctAnswer) 
            ? q.correctAnswer.join(', ') 
            : q.correctAnswer;
        });
      }
      
      return {
        title: data.title,
        instructions: data.instructions,
        questions,
        answerKey
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      
      // Fallback to a simple template if parsing fails
      return this.createFallbackWorksheet(type, includeAnswerKey);
    }
  }

  /**
   * Parse the AI grading response
   */
  private parseGradingResponse(text: string): AIGradingResponse {
    try {
      // Find JSON content in the response
      const jsonMatch = text.match(/\{[\s\S]*\}/m);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI grading response');
      }
      
      // Clean up the JSON string - replace single quotes with double quotes
      // and ensure property names are properly double-quoted
      let jsonStr = jsonMatch[0];
      
      // Replace unquoted or single-quoted property names with double-quoted ones
      // This regex finds property names that are either unquoted or have single quotes
      jsonStr = jsonStr.replace(/([{,]\s*)(['"]?)([a-zA-Z0-9_]+)\2(\s*:)/g, '$1"$3"$4');
      
      // Replace single-quoted string values with double-quoted ones
      jsonStr = jsonStr.replace(/:\s*'([^']*)'/g, ': "$1"');
      
      // Remove trailing commas in objects and arrays which are invalid in JSON
      jsonStr = jsonStr.replace(/,\s*([\]}])/g, '$1');
      
      console.log('Sanitized JSON string:', jsonStr);
      
      const data = JSON.parse(jsonStr) as AIGradingResponse;
      
      // Validate the parsed data
      if (!data.overallFeedback || !Array.isArray(data.gradedAnswers) || typeof data.score !== 'number') {
        throw new Error('Invalid grading data format');
      }
      
      return data;
    } catch (error) {
      console.error('Error parsing AI grading response:', error);
      
      // Return a basic error response
      return {
        overallFeedback: 'Unable to grade worksheet. Please try again or grade manually.',
        gradedAnswers: [],
        score: 0
      };
    }
  }

  /**
   * Create a fallback worksheet if AI generation fails
   */
  private createFallbackWorksheet(type: string, includeAnswerKey: boolean): AIGeneratedWorksheet {
    const title = `${type.charAt(0).toUpperCase() + type.slice(1)} Practice`;
    const instructions = 'Answer the following questions to the best of your ability.';
    
    // Create some basic questions based on the type
    const questions: WorksheetQuestion[] = [];
    
    if (type === 'grammar') {
      questions.push({
        id: '1',
        type: 'multiple-choice',
        question: 'Which sentence is grammatically correct?',
        options: [
          'She don\'t like ice cream.',
          'She doesn\'t like ice cream.',
          'Her don\'t like ice cream.',
          'Her doesn\'t likes ice cream.'
        ],
        correctAnswer: 'She doesn\'t like ice cream.',
        points: 2
      });
    } else if (type === 'vocabulary') {
      questions.push({
        id: '1',
        type: 'fill-blank',
        question: 'The opposite of "hot" is _____.',
        correctAnswer: 'cold',
        points: 2
      });
    } else { // reading comprehension
      questions.push({
        id: '1',
        type: 'short-answer',
        question: 'Summarize the main idea of the passage in 2-3 sentences.',
        correctAnswer: 'This will depend on the passage.',
        points: 5
      });
    }
    
    // Create answer key
    const answerKey: Record<string, string> = {};
    if (includeAnswerKey) {
      questions.forEach(q => {
        answerKey[q.id] = Array.isArray(q.correctAnswer) 
          ? q.correctAnswer.join(', ') 
          : q.correctAnswer;
      });
    }
    
    return {
      title,
      instructions,
      questions,
      answerKey
    };
  }

  private getDefaultPoints(type: string): number {
    switch (type) {
      case 'essay':
        return 10;
      case 'short-answer':
        return 5;
      case 'fill-blank':
      case 'multiple-choice':
      default:
        return 2;
    }
  }
}
