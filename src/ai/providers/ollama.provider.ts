import { getValidatedConfig } from '../../config/env';
import { AIProvider, AICompletionOptions } from './ai-provider.interface';

export class OllamaProvider implements AIProvider {
  private baseUrl: string;
  private model: string;

  constructor() {
    const config = getValidatedConfig();
    this.baseUrl = config.AI_BASE_URL.replace(/\/+$/, '');
    this.model = config.AI_MODEL;
  }

  public async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  }

  public async generateText(options: AICompletionOptions): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          system: options.systemPrompt,
          prompt: options.userPrompt,
          stream: false,
          options: {
            temperature: options.temperature ?? 0.2,
            num_predict: options.maxTokens ?? 768,
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama responded with status: ${response.status}`);
      }

      const data = (await response.json()) as { response?: string };
      return data.response || '';
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      throw err;
    }
  }
}

export const ollamaProvider = new OllamaProvider();
