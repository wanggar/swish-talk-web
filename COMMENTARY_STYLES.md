# Commentary Styles Guide

SwishTalk now supports multiple commentary styles that provide different voices and personalities for your basketball video commentary.

## Available Commentary Styles

### 🏀 ESPN Classic
- **ID**: `espn-classic`
- **Description**: Traditional ESPN-style professional basketball commentary
- **Voice ID**: `6XVUA6jZZtcqPTW6amVC`
- **Characteristics**: Professional, Traditional, Authoritative, Classic
- **Best for**: Official game highlights, professional content

### 🎙️ Kevin Harlan
- **ID**: `kevin-harlan`
- **Description**: Legendary NBA broadcaster known for dramatic, passionate play-by-play
- **Voice ID**: `YiUJCEfHcazOOIxtzmUX`
- **Characteristics**: Dramatic, Passionate, Legendary, Play-by-play Master
- **Best for**: Exciting moments, clutch plays, memorable game calls

### 🎭 Shaq-style
- **ID**: `shaq`
- **Description**: Fun, energetic commentary with Shaq's signature humor and personality
- **Voice ID**: `JOKTHcIeblGXUEbmjczE`
- **Characteristics**: Humorous, Energetic, Casual, Player Perspective
- **Best for**: Entertaining highlights, social media content

### 🔥 NBA Hype
- **ID**: `nba-hype`
- **Description**: High-energy, exciting commentary perfect for highlight reels
- **Voice ID**: `bJwlnpYc7IzL75IA8ehy`
- **Characteristics**: High Energy, Exciting, Modern, Hype-focused
- **Best for**: Dunks, amazing plays, viral content

### 🇬🇧 British Sports
- **ID**: `british-sports`
- **Description**: Sophisticated, articulate commentary with British flair
- **Voice ID**: `8t6x0k43h2faV0HDWfnn`
- **Characteristics**: Sophisticated, Articulate, Professional, International
- **Best for**: Tactical analysis, international audience content

## API Usage

### Using Commentary Styles (Recommended)

```bash
# New user-friendly approach
GET /api/get-commentary-audio?videoId=VIDEO_ID&duration=30&commentaryStyle=shaq
GET /api/basketball-audio?videoId=VIDEO_ID&duration=30&commentaryStyle=nba-hype
```

### Legacy Voice ID Support

```bash
# Still supported for backward compatibility
GET /api/get-commentary-audio?videoId=VIDEO_ID&duration=30&voiceId=JOKTHcIeblGXUEbmjczE
```

### Available Styles Endpoint

```bash
GET /api/commentary-styles
```

Returns:
```json
{
  "success": true,
  "styles": [
    {
      "id": "espn-classic",
      "name": "ESPN Classic",
      "description": "Traditional ESPN-style professional basketball commentary",
      "voiceId": "6XVUA6jZZtcqPTW6amVC",
      "characteristics": ["Professional", "Traditional", "Authoritative", "Classic"]
    },
    // ... other styles
  ]
}
```

## Implementation Details

### Voice Style Mapping
- Located in `lib/voice-styles.ts`
- Maps user-friendly style names to ElevenLabs voice IDs
- Provides validation and fallback mechanisms

### API Updates
- All endpoints now accept `commentaryStyle` parameter
- Legacy `voiceId` parameter still works for backward compatibility
- `voiceId` takes precedence over `commentaryStyle` if both are provided

### UI Changes
- Test interface now uses dropdown selection instead of text input
- Displays style names and descriptions for better UX
- Automatically maps selections to appropriate voice IDs

## Migration Guide

### For Existing Users
- Your existing `voiceId` parameters will continue to work
- No breaking changes to current implementations
- Consider migrating to `commentaryStyle` for better UX

### For New Integrations
- Use `commentaryStyle` parameter instead of `voiceId`
- Implement style selection UI for better user experience
- Use `/api/commentary-styles` to populate style options dynamically

## Adding New Styles

To add a new commentary style:

1. Add the style to `COMMENTARY_STYLES` array in `lib/voice-styles.ts`
2. Include the ElevenLabs voice ID and style metadata
3. Update the test UI dropdown options
4. Test the new style with sample content

Example:
```typescript
{
  id: 'new-style',
  name: 'New Style Name',
  description: 'Description of the new style',
  voiceId: 'ELEVENLABS_VOICE_ID',
  characteristics: ['Trait1', 'Trait2', 'Trait3']
}
```