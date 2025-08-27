import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

Video Description: "${videoDescription}"

Commentary:`;

    // Calculate max tokens based on realistic speech duration
    // Rule of thumb: ~1.3 tokens per word, so tokens = words * 1.3
    const getMaxTokens = (seconds?: number): number => {
      if (!seconds) return 50; // Default ~40 words
      
      const wordsNeeded = Math.round(seconds * 2.5); // 2.5 words per second
      const tokensNeeded = Math.round(wordsNeeded * 1.3); // 1.3 tokens per word
      
      // Add small buffer for natural speech flow
      return Math.min(tokensNeeded + 10, 200); // Cap at 200 tokens max
    };

    const maxTokens = getMaxTokens(durationSeconds);
    console.log(`📝 Max tokens set to: ${maxTokens} for ${durationSeconds || 'unspecified'} second(s) (≈${durationSeconds ? Math.round(durationSeconds * 2.5) : 40} words)`);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert ESPN basketball commentator known for your exciting, knowledgeable, and dramatic commentary style. You bring basketball games to life with your words."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.8, // Higher temperature for more creative and varied commentary
    });

    const commentary = completion.choices[0]?.message?.content;
    
    if (!commentary) {
      throw new Error('No commentary generated from OpenAI');
    }

    console.log('✅ Basketball commentary generated successfully');
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