import { AIService } from './ai-service'
import { OpenAIService } from './openai-service'
import { ClaudeService } from './claude-service'
import { GeminiService } from './gemini-service'

export class AIServiceFactory {
  static createService(aiService: string): AIService {
    switch (aiService) {
      case 'gpt-4':
        return new OpenAIService()
      case 'claude':
        return new ClaudeService()
      case 'gemini':
        return new GeminiService()
      default:
        throw new Error(`Unsupported AI service: ${aiService}`)
    }
  }

  static getSupportedServices(): string[] {
    return ['gpt-4', 'claude', 'gemini']
  }

  static getServiceDisplayName(aiService: string): string {
    const displayNames: { [key: string]: string } = {
      'gpt-4': 'GPT-4',
      'claude': 'Claude Sonnet',
      'gemini': 'Gemini Pro'
    }
    
    return displayNames[aiService] || aiService
  }
}