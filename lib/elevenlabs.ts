import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

// Initialize ElevenLabs client
const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

/**
 * Generate speech audio from text using ElevenLabs
 * @param text - The text to convert to speech
 * @param voiceId - The voice ID to use (default: 6XVUA6jZZtcqPTW6amVC)
 * @returns Promise<Buffer> - Audio buffer containing the generated speech
 */
export async function generateSpeech(
  text: string, 
  voiceId: string = '6XVUA6jZZtcqPTW6amVC'
): Promise<Buffer> {
  try {
    console.log('🔊 Generating speech with ElevenLabs...');
    console.log(`📝 Text length: ${text.length} characters`);
    console.log(`🎤 Voice ID: ${voiceId}`);
    
    const audio = await elevenlabs.textToSpeech.convert(voiceId, {
      text: text,
      modelId: 'eleven_turbo_v2', // Fast, high-quality model
      voiceSettings: {
        stability: 0.8,
        similarityBoost: 0.8,
        style: 0.5,
        useSpeakerBoost: true
      }
    });

    // Convert the audio response to a Buffer
    const chunks: Uint8Array[] = [];
    
    // Check if audio is a ReadableStream
    if (audio && typeof audio.getReader === 'function') {
      const reader = audio.getReader();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    } else {
      // Handle different response format
      const arrayBuffer = await (audio as unknown as Response).arrayBuffer();
      chunks.push(new Uint8Array(arrayBuffer));
    }
    
    const audioBuffer = Buffer.concat(chunks);
    console.log(`✅ Speech generated successfully! Audio size: ${audioBuffer.length} bytes`);
    
    return audioBuffer;
    
  } catch (error) {
    console.error('❌ ElevenLabs speech generation failed:', error);
    
    if (error instanceof Error) {
      throw new Error(`ElevenLabs API error: ${error.message}`);
    }
    
    throw new Error('Unknown ElevenLabs API error');
  }
}

/**
 * Get available voices from ElevenLabs
 * @returns Promise<any[]> - Array of available voices
 */
export async function getAvailableVoices(): Promise<unknown[]> {
  try {
    console.log('🎤 Fetching available voices...');
    
    const voices = await elevenlabs.voices.search();
    
    console.log(`✅ Found ${voices.voices.length} available voices`);
    return voices.voices;
    
  } catch (error) {
    console.error('❌ Failed to fetch voices:', error);
    throw new Error('Failed to fetch available voices');
  }
}