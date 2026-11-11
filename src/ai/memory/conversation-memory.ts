export interface ConversationContext {
  budget?: number;
  category?: string;
  brand?: string;
  lastProductIds?: string[];
  language?: 'en' | 'ur' | 'roman_ur';
  inquiryType?: 'PRODUCT_SEARCH' | 'ORDER_TRACKING' | 'POLICY' | 'SUPPORT';
}

export class ConversationMemory {
  public static extractContextFromMessage(
    message: string,
    existingContext: ConversationContext = {}
  ): ConversationContext {
    const updated: ConversationContext = { ...existingContext };
    const lower = message.toLowerCase();

    // 1. Language Detection
    if (/[\u0600-\u06FF]/.test(message)) {
      updated.language = 'ur';
    } else if (
      /\b(kya|kaha|kahan|chahiye|kitna|kitne|batao|dikhao|acha|wapsi|tabdeeli|bhai|mujhe|andar|tak)\b/i.test(
        lower
      )
    ) {
      updated.language = 'roman_ur';
    } else {
      updated.language = 'en';
    }

    // 2. Budget Extraction (e.g. "5000 ke andar", "10k tak", "under 50000", "5 hazar")
    const budgetMatch =
      lower.match(/(\d+)\s*(k|hazar|thousand)?\s*(tak|ke andar|under|below|budget|pkr|rs)/i) ||
      lower.match(/(under|below|budget|within|around)\s*(\d+)\s*(k|hazar)?/i);

    if (budgetMatch) {
      const rawNum = parseInt(budgetMatch[1] || budgetMatch[2], 10);
      const isK = lower.includes('k') || lower.includes('hazar') || lower.includes('thousand');
      if (!isNaN(rawNum)) {
        updated.budget = isK && rawNum < 1000 ? rawNum * 1000 : rawNum;
      }
    }

    // 3. Category Detection
    if (lower.includes('earbud') || lower.includes('airbud') || lower.includes('headphone') || lower.includes('tws')) {
      updated.category = 'cat-earbuds';
    } else if (lower.includes('phone') || lower.includes('mobile') || lower.includes('smartphone')) {
      updated.category = 'cat-smartphones';
    } else if (lower.includes('watch') || lower.includes('smartwatch')) {
      updated.category = 'cat-smartwatches';
    } else if (lower.includes('laptop') || lower.includes('notebook')) {
      updated.category = 'cat-laptops';
    } else if (lower.includes('charger') || lower.includes('cable') || lower.includes('power bank') || lower.includes('powerbank')) {
      updated.category = 'cat-accessories';
    } else if (lower.includes('monitor') || lower.includes('keyboard') || lower.includes('mouse')) {
      updated.category = 'cat-monitors';
    }

    // 4. Brand Detection
    const brands = ['xiaomi', 'redmi', 'samsung', 'audionic', 'soundpeats', 'infinix', 'tecno', 'anker', 'baseus', 'lenovo', 'hp', 'dell', 'logitech', 'redragon', 'haylou', 'kieslect'];
    for (const b of brands) {
      if (lower.includes(b)) {
        updated.brand = b;
        break;
      }
    }

    return updated;
  }
}
