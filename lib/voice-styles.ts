/**
 * Voice Style Mapping System
 * Maps user-friendly commentary styles to ElevenLabs voice IDs
 */

export interface CommentaryStyle {
  id: string;
  name: string;
  description: string;
  voiceId: string;
  characteristics: string[];
}

/**
 * Available commentary styles with their corresponding voice IDs
 */
export const COMMENTARY_STYLES: CommentaryStyle[] = [
  {
    id: 'kevin-harlan',
    name: 'Kevin Harlan',
    description: 'Legendary NBA broadcaster known for dramatic, passionate play-by-play',
    voiceId: 'YiUJCEfHcazOOIxtzmUX',
    characteristics: ['Dramatic', 'Passionate', 'Legendary', 'Play-by-play Master']
  },
  {
    id: 'mike-breen',
    name: 'Mike Breen',
    description: 'High-energy, exciting commentary perfect for highlight reels',
    voiceId: 'bJwlnpYc7IzL75IA8ehy',
    characteristics: ['High Energy', 'Exciting', 'Modern', 'Hype-focused']
  },
  {
    id: 'british-analyst',
    name: 'British Analyst',
    description: 'Sophisticated, articulate commentary with British flair',
    voiceId: '8t6x0k43h2faV0HDWfnn',
    characteristics: ['Sophisticated', 'Articulate', 'Professional', 'International']
  },
  {
    id: 'espn-steroid',
    name: 'ESPN on Steroid',
    description: 'Traditional ESPN-style professional basketball commentary with extra intensity',
    voiceId: '6XVUA6jZZtcqPTW6amVC',
    characteristics: ['Professional', 'Intense', 'Authoritative', 'High Energy']
  }
];

/**
 * Get voice ID from commentary style
 * @param styleId - The commentary style identifier
 * @returns Voice ID for ElevenLabs API
 */
export function getVoiceIdFromStyle(styleId: string): string {
  const style = COMMENTARY_STYLES.find(s => s.id === styleId);
  if (!style) {
    console.warn(`Unknown commentary style: ${styleId}, falling back to ESPN on Steroid`);
    return COMMENTARY_STYLES.find(s => s.id === 'espn-steroid')!.voiceId;
  }
  return style.voiceId;
}

/**
 * Get commentary style from voice ID (for backward compatibility)
 * @param voiceId - The ElevenLabs voice ID
 * @returns Commentary style object or null if not found
 */
export function getStyleFromVoiceId(voiceId: string): CommentaryStyle | null {
  return COMMENTARY_STYLES.find(s => s.voiceId === voiceId) || null;
}

/**
 * Validate commentary style
 * @param styleId - The commentary style identifier to validate
 * @returns True if style exists
 */
export function isValidCommentaryStyle(styleId: string): boolean {
  return COMMENTARY_STYLES.some(s => s.id === styleId);
}

/**
 * Get default commentary style
 * @returns Default commentary style (ESPN on Steroid)
 */
export function getDefaultCommentaryStyle(): CommentaryStyle {
  return COMMENTARY_STYLES.find(s => s.id === 'espn-steroid')!;
}