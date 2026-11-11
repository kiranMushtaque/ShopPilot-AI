import { db } from '../../db/store';
import { ChatMessage, Product } from '../../types';
import { sanitizeAndCheckPrompt } from '../guardrails/injection-defense';
import { ConversationMemory } from '../memory/conversation-memory';
import { ollamaProvider } from '../providers/ollama.provider';
import { RuleFallbackProvider } from '../providers/rule-fallback.provider';
import { ToolExecutionContext, ToolResult } from '../tools/executor';

const SYSTEM_PROMPT = `
You are ShopPilot AI, the autonomous e-commerce digital sales and support associate for ShopPilot PK Electronics.
You speak fluently in English, Urdu, and Roman Urdu.
Always ground answers strictly in verified tool results.
Never fabricate prices, inventory, delivery times, or policies.
If information is absent, state that it is unavailable.
All prices are in Pakistani Rupees (PKR / Rs.).
`;

export class AgentOrchestrator {
  public static async handleUserMessage(params: {
    sessionToken: string;
    message: string;
    userId?: string;
    userRole?: 'ADMIN' | 'SUPPORT' | 'CUSTOMER';
    customerName?: string;
  }): Promise<{ message: ChatMessage; suggestedProducts?: Product[]; ollamaStatus: 'online' | 'fallback_mode' }> {
    const { sessionToken, message, userId, userRole, customerName } = params;

    // 1. Get or create conversation
    const conversation = await db.getOrCreateConversation(sessionToken, userId);

    // 2. Guardrails & Prompt Injection Defense
    const guardrailCheck = sanitizeAndCheckPrompt(message);
    if (!guardrailCheck.isSafe) {
      // Record user message
      await db.addMessageToConversation(conversation.id, {
        sender: 'USER',
        content: message,
      });

      // Refusal response
      const refusalMsg = await db.addMessageToConversation(conversation.id, {
        sender: 'AGENT',
        content: `Maazrat! Main security rules, administrative credentials, ya pricing data ko alter nahi kar sakta. Main sirf ShopPilot PK catalog, orders aur policies mein aapki madad kar sakta hoon.`,
      });

      return {
        message: refusalMsg,
        ollamaStatus: 'online',
      };
    }

    // 3. Record verified user message in DB
    await db.addMessageToConversation(conversation.id, {
      sender: 'USER',
      content: guardrailCheck.sanitizedText,
    });

    // 4. Build Tool Execution Context
    const toolCtx: ToolExecutionContext = {
      sessionToken,
      userId,
      userRole,
      customerName,
      conversationId: conversation.id,
    };

    // 5. Update Conversation Memory
    conversation.metadata = ConversationMemory.extractContextFromMessage(
      guardrailCheck.sanitizedText,
      conversation.metadata
    );

    let finalResponseText = '';
    const allSuggestedProducts: Product[] = [];
    const recordedToolCalls: Array<{
      name: string;
      args: Record<string, unknown>;
      status: 'PENDING' | 'SUCCESS' | 'FAILED';
      result?: unknown;
    }> = [];
    let ollamaStatus: 'online' | 'fallback_mode' = 'fallback_mode';

    // 6. Check Ollama availability
    const isOllamaOnline = await ollamaProvider.isAvailable();

    if (isOllamaOnline) {
      try {
        ollamaStatus = 'online';
        // Execute rule extraction + Ollama synthesis
        const { responseText, toolResults } = await RuleFallbackProvider.process(
          guardrailCheck.sanitizedText,
          toolCtx,
          conversation.metadata
        );

        toolResults.forEach((tr: ToolResult) => {
          recordedToolCalls.push({
            name: tr.toolName,
            args: {},
            status: tr.status,
            result: tr.data,
          });
          if (tr.suggestedProducts) {
            allSuggestedProducts.push(...tr.suggestedProducts);
          }
        });

        // Refine with Ollama if possible
        try {
          const refined = await ollamaProvider.generateText({
            systemPrompt: SYSTEM_PROMPT,
            userPrompt: `Customer asked: "${guardrailCheck.sanitizedText}". Verified system data: ${JSON.stringify(
              toolResults.map((t) => t.message)
            )}. Reply politely in matching language (English/Urdu/Roman Urdu). Keep it concise.`,
            maxTokens: 256,
          });
          finalResponseText = refined.trim() || responseText;
        } catch {
          finalResponseText = responseText;
        }
      } catch {
        ollamaStatus = 'fallback_mode';
        const fallback = await RuleFallbackProvider.process(
          guardrailCheck.sanitizedText,
          toolCtx,
          conversation.metadata
        );
        finalResponseText = fallback.responseText;
        fallback.toolResults.forEach((tr: ToolResult) => {
          if (tr.suggestedProducts) allSuggestedProducts.push(...tr.suggestedProducts);
        });
      }
    } else {
      ollamaStatus = 'fallback_mode';
      // Graceful local deterministic NLP processing
      const fallback = await RuleFallbackProvider.process(
        guardrailCheck.sanitizedText,
        toolCtx,
        conversation.metadata
      );
      finalResponseText = fallback.responseText;
      fallback.toolResults.forEach((tr: ToolResult) => {
        recordedToolCalls.push({
          name: tr.toolName,
          args: {},
          status: tr.status,
          result: tr.data,
        });
        if (tr.suggestedProducts) {
          allSuggestedProducts.push(...tr.suggestedProducts);
        }
      });
    }

    // De-duplicate suggested products by ID
    const uniqueProducts = Array.from(new Map(allSuggestedProducts.map((p) => [p.id, p])).values());

    // 7. Save Assistant Message to DB with 3-state tool execution log
    const agentMessage = await db.addMessageToConversation(conversation.id, {
      sender: 'AGENT',
      content: finalResponseText,
      suggestedProducts: uniqueProducts.length > 0 ? uniqueProducts : undefined,
      toolCalls: recordedToolCalls.length > 0 ? recordedToolCalls : undefined,
    });

    return {
      message: agentMessage,
      suggestedProducts: uniqueProducts,
      ollamaStatus,
    };
  }
}
