import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Ensures commentary ends with complete sentences and is appropriately sized
 * 
 * @param rawCommentary - The raw commentary from OpenAI
 * @param targetWords - Target word count for the commentary
 * @returns Cleaned commentary with complete sentences
 */
function ensureCompleteCommentary(rawCommentary: string, targetWords: number): string {
  // Clean up the commentary by removing any incomplete trailing text
  let commentary = rawCommentary.trim();
  
  // Split into sentences - look for sentence endings
  const sentenceEnders = /[.!?]+/g;
  const sentences: string[] = [];
  let lastIndex = 0;
  let match;
  
  while ((match = sentenceEnders.exec(commentary)) !== null) {
    const sentence = commentary.substring(lastIndex, match.index + match[0].length).trim();
    if (sentence.length > 0) {
      sentences.push(sentence);
    }
    lastIndex = match.index + match[0].length;
  }
  
  // If there's remaining text after the last sentence, check if it looks complete
  const remainingText = commentary.substring(lastIndex).trim();
  if (remainingText.length > 0) {
    // Only add remaining text if it seems like a complete thought
    // (has reasonable length and doesn't end abruptly)
    if (remainingText.length > 10 && (
      remainingText.endsWith('.') || 
      remainingText.endsWith('!') || 
      remainingText.endsWith('?') ||
      // Check if it looks like a complete clause (basic heuristic)
      remainingText.includes(' and ') || 
      remainingText.includes(' with ') ||
      remainingText.includes(' as ')
    )) {
      sentences.push(remainingText);
    }
  }
  
  if (sentences.length === 0) {
    // Fallback: if no sentences found, return the original but ensure it ends properly
    if (!commentary.match(/[.!?]$/)) {
      commentary += '.';
    }
    return commentary;
  }
  
  // Calculate word counts for each sentence
  const sentenceWordCounts = sentences.map(s => s.split(/\s+/).length);
  const totalWords = sentenceWordCounts.reduce((sum, count) => sum + count, 0);
  
  // If we're already close to target or under, return all complete sentences
  if (totalWords <= targetWords * 1.2) { // 20% tolerance
    return sentences.join(' ');
  }
  
  // If we have too many words, find the best subset of sentences
  let cumulativeWords = 0;
  let selectedSentences: string[] = [];
  
  for (let i = 0; i < sentences.length; i++) {
    const sentenceWords = sentenceWordCounts[i];
    
    // If adding this sentence would exceed target by more than 30%, stop here
    if (cumulativeWords + sentenceWords > targetWords * 1.3) {
      break;
    }
    
    selectedSentences.push(sentences[i]);
    cumulativeWords += sentenceWords;
  }
  
  // Ensure we have at least one sentence
  if (selectedSentences.length === 0 && sentences.length > 0) {
    selectedSentences = [sentences[0]];
  }
  
  return selectedSentences.join(' ');
}

/**
 * Converts a video description into ESPN-style basketball commentary
 * 
 * @param videoDescription - The description of the basketball video to commentate on
 * @param durationSeconds - The duration of the video in seconds to match commentary length
 * @returns Promise<string> - ESPN-style basketball commentary
 */
export async function generateBasketballCommentary(videoDescription: string, durationSeconds?: number): Promise<string> {
  try {
    console.log('🏀 Generating ESPN-style basketball commentary...');
    console.log(`⏱️ Video duration: ${durationSeconds ? `${durationSeconds} seconds` : 'not specified'}`);
    
    // Calculate appropriate commentary length based on actual speech duration
    // Average speaking rate: 150-200 words per minute (2.5-3.3 words per second)
    const getDurationGuidance = (seconds?: number): string => {
      if (!seconds) return "Generate a moderate-length commentary (about 30-40 words).";
      
      const wordsNeeded = Math.round(seconds * 2.5); // Conservative 2.5 words per second
      
      if (seconds <= 5) return `Generate a very brief commentary (${wordsNeeded} words maximum) - just 1-2 short sentences for this quick moment.`;
      if (seconds <= 15) return `Generate a short commentary (${wordsNeeded} words maximum) - 2-3 sentences for this brief action.`;
      if (seconds <= 30) return `Generate a moderate commentary (${wordsNeeded} words maximum) - about 1 paragraph for this sequence.`;
      if (seconds <= 60) return `Generate a detailed commentary (${wordsNeeded} words maximum) - 2 paragraphs for this extended sequence.`;
      if (seconds <= 120) return `Generate a comprehensive commentary (${wordsNeeded} words maximum) - 2-3 paragraphs for this long sequence.`;
      return `Generate an extensive commentary (${wordsNeeded} words maximum) - 3-4 paragraphs for this lengthy sequence.`;
    };

    const durationGuidance = getDurationGuidance(durationSeconds);
    
    const prompt = `You are a legendary ESPN basketball commentator with decades of experience calling the most exciting games in NBA history. Your style is energetic, knowledgeable, and captures the drama and excitement of every moment on the court.

Transform the following video description into captivating ESPN-style basketball commentary. Make it sound like you're calling a live game with:

- High energy and excitement
- Expert basketball knowledge and terminology
- Dramatic flair and storytelling
- References to player skills, strategy, and game context
- Use of classic basketball commentary phrases
- Build tension and excitement around key moments
- Professional broadcaster voice and pacing

${durationGuidance}

IMPORTANT: Provide only the commentary text without quotes or any formatting. End with complete sentences only.

Video Description: "${videoDescription}"

Commentary:`;

    // Calculate target words based on realistic speech duration
    // Average speaking rate: 150-200 words per minute (2.5-3.3 words per second)
    const getTargetWords = (seconds?: number): number => {
      if (!seconds) return 40; // Default ~40 words
      return Math.round(seconds * 2.5); // 2.5 words per second
    };

    const targetWords = getTargetWords(durationSeconds);
    
    // Use a generous token limit to avoid cutoffs, then trim to complete sentences
    // GPT-4 typically uses ~1.3 tokens per word, so we'll use a 2x buffer for safety
    const generousTokenLimit = Math.max(targetWords * 3, 150); // At least 150 tokens, usually much more
    console.log(`📝 Target words: ${targetWords} for ${durationSeconds || 'unspecified'} second(s), using generous token limit: ${generousTokenLimit}`);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert ESPN basketball commentator known for your exciting, knowledgeable, and dramatic commentary style. You bring basketball games to life with your words. Always complete your sentences and thoughts naturally."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: generousTokenLimit,
      temperature: 0.8, // Higher temperature for more creative and varied commentary
    });

    let commentary = completion.choices[0]?.message?.content;
    
    if (!commentary) {
      throw new Error('No commentary generated from OpenAI');
    }

    // Post-process to ensure complete sentences and appropriate length
    commentary = ensureCompleteCommentary(commentary, targetWords);

    console.log('✅ Basketball commentary generated successfully');
    console.log(`📊 Final commentary: ${commentary.split(' ').length} words (target: ${targetWords})`);
    return commentary;

  } catch (error) {
    console.error('❌ Failed to generate basketball commentary:', error);
    
    if (error instanceof Error) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
    
    throw new Error('Unknown error occurred while generating commentary');
  }
}

/**
 * Test function to validate OpenAI connection
 */
export async function testOpenAIConnection(): Promise<boolean> {
  try {
    console.log('🔍 Testing OpenAI connection...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: "Say 'OpenAI connection successful' if you can hear me."
        }
      ],
      max_tokens: 50,
    });

    const response = completion.choices[0]?.message?.content;
    console.log('✅ OpenAI connection test successful:', response);
    
    return true;
  } catch (error) {
    console.error('❌ OpenAI connection test failed:', error);
    return false;
  }
}