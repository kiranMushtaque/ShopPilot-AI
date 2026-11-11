export interface AICompletionOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIProvider {
  isAvailable(): Promise<boolean>;
  generateText(options: AICompletionOptions): Promise<string>;
}
