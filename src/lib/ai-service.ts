import { AIWorksheetGenerator } from './ai-generator';
import { WorksheetQuestion } from './database';
import { Topic } from './topics';

export interface WorksheetRequest {
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
  regenerateTimestamp?: number; // Used to force unique worksheets when regenerating
}

// Response cache with 5-minute TTL
const responseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class AIService {
  private generator: AIWorksheetGenerator;
  private retryLimit = 2;
  private retryDelay = 1000; // 1 second

  constructor() {
    this.generator = new AIWorksheetGenerator();
  }

  private getCacheKey(request: WorksheetRequest): string {
    return JSON.stringify({
      grade: request.grade,
      type: request.type,
      topics: request.topics.map(t => t.id).sort(),
      questionTypes: request.questionTypes?.sort(),
      difficulty: request.difficulty,
      questionCount: request.questionCount,
      includeAnswerKey: request.includeAnswerKey,
      timeLimit: request.timeLimit,
      showHints: request.showHints,
      allowRetries: request.allowRetries
    });
  }

  async generateWorksheet(request: WorksheetRequest, forceRefresh: boolean = false) {
    // When regenerating, add a timestamp to ensure uniqueness
    if (forceRefresh) {
      request = {
        ...request,
        regenerateTimestamp: Date.now() // Add timestamp to force new generation
      };
    }
    
    const cacheKey = this.getCacheKey(request);
    const cached = responseCache.get(cacheKey);
    
    // Return cached response if valid and not forcing refresh
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    // Optimized request parameters
    const optimizedRequest = {
      ...request,
      // Limit question count to reasonable defaults
      questionCount: Math.min(Math.max(5, request.questionCount), 20),
      // Ensure time limit is reasonable
      timeLimit: request.timeLimit ? Math.min(Math.max(5, request.timeLimit), 60) : 15
    };

    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts <= this.retryLimit) {
      try {
        const result = await this.generator.generateWorksheet(optimizedRequest);
        
        // Cache the successful response
        responseCache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
        
        return result;
      } catch (error) {
        lastError = error as Error;
        attempts++;
        
        if (attempts <= this.retryLimit) {
          // Exponential backoff
          await new Promise(resolve => 
            setTimeout(resolve, this.retryDelay * Math.pow(2, attempts - 1))
          );
        }
      }
    }


    // If all retries fail, return a fallback worksheet
    return this.getFallbackWorksheet(request);
  }


  private getFallbackWorksheet(request: WorksheetRequest) {
    // Simple fallback content
    return {
      title: `Worksheet on ${request.topics.map(t => t.name).join(', ')}`,
      instructions: 'Complete the following questions to the best of your ability.',
      questions: Array.from({ length: Math.min(5, request.questionCount) }, (_, i) => ({
        id: `q${i + 1}`,
        type: 'short-answer' as const,
        question: `This is a sample question about ${request.topics[0]?.name || 'the topic'}.`,
        answer: 'Sample answer'
      })),
      answerKey: {}
    };
  }
}

export const aiService = new AIService();
