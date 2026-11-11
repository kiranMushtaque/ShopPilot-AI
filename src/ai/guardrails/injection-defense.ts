export interface SanitizationResult {
  isSafe: boolean;
  flaggedReason?: string;
  sanitizedText: string;
}

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+(instructions|prompts|rules)/i,
  /you\s+are\s+now\s+in\s+developer\s+mode/i,
  /system\s*prompt\s*reveal/i,
  /what\s+is\s+your\s+system\s+prompt/i,
  /give\s+me\s+(admin|root)\s+(password|access|credentials)/i,
  /drop\s+table/i,
  /select\s+\*\s+from\s+users/i,
  /change\s+price\s+to\s+1/i,
  /set\s+price\s*=\s*0/i,
  /give\s+me\s+all\s+orders/i,
];

export function sanitizeAndCheckPrompt(input: string): SanitizationResult {
  const text = input.trim();

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isSafe: false,
        flaggedReason: 'Detected unauthorized rule override or security evasion attempt.',
        sanitizedText: text,
      };
    }
  }

  // Sanitize script tags and control characters
  const sanitized = text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

  return {
    isSafe: true,
    sanitizedText: sanitized,
  };
}
