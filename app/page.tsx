'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

type VideoOption = {
  id: string;
  filename: string;
  title: string;
  description: string;
};

type CommentaryStyle = {
  id: string;
  name: string;
  avatar: string;
  description: string;
  tooltip: string;
  previewUrl?: string;
};

const videos: VideoOption[] = [
  {
    id: '68aac64d88cce82e525f1059',
    filename: '68aac64d88cce82e525f1059.mp4',
    title: 'Overtime Buzzer Beater',
    description: 'Clutch moments that define legends'
  },
  {
    id: '68aac7ba35d02f447a6a77f1',
    filename: '68aac7ba35d02f447a6a77f1.mp4',
    title: 'High-Flying Dunks',
    description: 'Above the rim dominance'
  },
  {
    id: '68aac91f88cce82e525f1803',
    filename: '68aac91f88cce82e525f1803.mp4',
    title: '1v1 at Venice Beach',
    description: 'Street basketball poetry'
  },
  {
    id: '68ad30cf5a89e2decaa1211e',
    filename: '68ad30cf5a89e2decaa1211e.MOV',
    title: 'Fast Break Frenzy',
    description: 'Lightning speed transitions'
  }
];

const commentaryStyles: CommentaryStyle[] = [
  {
    id: 'kevin-harlan',
    name: 'Kevin Harlan',
    avatar: '/commentator-avatar-photo/kevin-harlan.png',
    description: 'Legendary NBA broadcaster known for dramatic, passionate play-by-play',
    tooltip: 'Dramatic and passionate commentary',
    previewUrl: '/commentary-sample/voice_preview_kevin harlan.mp3'
  },
  {
    id: 'mike-breen',
    name: 'Mike Breen',
    avatar: '/commentator-avatar-photo/mike-breen.png',
    description: 'High-energy, exciting commentary perfect for highlight reels',
    tooltip: 'High-energy broadcast style',
    previewUrl: '/commentary-sample/voice_preview_mike breen.mp3'
  },
  {
    id: 'british-analyst',
    name: 'British Analyst',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format',
    description: 'Sophisticated, articulate commentary with British flair',
    tooltip: 'Cerebral breakdown with British sophistication',
    previewUrl: '/commentary-sample/voice_preview_old british.mp3'
  },
  {
    id: 'espn-steroid',
    name: 'ESPN on Steroid',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face&auto=format',
    description: 'Traditional ESPN-style professional basketball commentary with extra intensity',
    tooltip: 'Prime-time broadcast with extra energy',
    previewUrl: '/commentary-sample/voice_preview_espn on steroid.mp3'
  }
];

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    commentary: string;
    audioUrl: string;
    videoUrl: string;
  } | null>(null);
  const [previewingStyle, setPreviewingStyle] = useState<string | null>(null);

  // Theme toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleGenerate = async () => {
    if (!selectedVideo || !selectedStyle) return;
    
    setIsGenerating(true);
    setResult(null);
    setProgress(0);
    
    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
    
    try {
      const response = await fetch(`/api/get-commentary-audio?videoId=${selectedVideo}&commentaryStyle=${selectedStyle}&duration=${duration}`);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(async () => {
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          
          if (contentType && contentType.includes('audio')) {
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            // Try to get commentary from headers, fallback to default
            const commentary = response.headers.get('X-Commentary') || 'Your highlight just got the prime-time treatment!';
            const selectedVideoData = videos.find(v => v.id === selectedVideo);
            
            setResult({
              commentary,
              audioUrl,
              videoUrl: `/switch-talk-test-videos/${selectedVideoData?.filename}`
            });
          } else {
            const data = await response.json();
            setResult({
              commentary: data.commentary || 'Your highlight just got the prime-time treatment!',
              audioUrl: '',
              videoUrl: `/switch-talk-test-videos/${videos.find(v => v.id === selectedVideo)?.filename}`
            });
          }
        }
        setIsGenerating(false);
      }, 500);
    } catch (error) {
      console.error('Error generating commentary:', error);
      setIsGenerating(false);
      clearInterval(progressInterval);
    }
  };

  const handleReset = () => {
    setResult(null);
    setSelectedVideo(null);
    setSelectedStyle(null);
    setDuration(30);
    setProgress(0);
  };

  const handleStylePreview = (styleId: string) => {
    const style = commentaryStyles.find(s => s.id === styleId);
    if (!style?.previewUrl) return;
    
    setPreviewingStyle(styleId);
    
    // Create and play audio
    const audio = new Audio(style.previewUrl);
    audio.play().catch(error => {
      console.error('Error playing audio preview:', error);
    });
    
    // Stop preview when audio ends or after max duration
    audio.addEventListener('ended', () => {
      setPreviewingStyle(null);
    });
    
    // Fallback timeout in case audio doesn't fire ended event
    setTimeout(() => {
      setPreviewingStyle(null);
      audio.pause();
      audio.currentTime = 0;
    }, 10000); // 10 second max preview
  };

  const themeClasses = isDarkMode 
    ? 'bg-neutral-950 text-white' 
    : 'bg-neutral-50 text-neutral-900';

  if (result) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${themeClasses}`}>
        {/* Theme Toggle */}
        <div className="fixed top-6 right-6 z-50">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-3 rounded-full transition-all duration-300 ${
              isDarkMode 
                ? 'bg-neutral-800 hover:bg-neutral-700 text-yellow-400' 
                : 'bg-white hover:bg-neutral-100 text-neutral-900 shadow-lg'
            }`}
          >
            {isDarkMode ? '🌞' : '🌙'}
          </button>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-16">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-mono lowercase tracking-wider text-red-600">
              swishtalk
            </h1>
          </div>

          {/* Video Player */}
          <div className="mb-8">
            <div className="relative rounded-xl overflow-hidden bg-neutral-900" style={{ height: '400px' }}>
              <video 
                controls 
                className="w-full h-full object-cover"
                poster=""
              >
                <source src={result.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              
              {/* Toggle for original vs commentary */}
              <div className="absolute top-4 right-4">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isDarkMode ? 'bg-neutral-800 text-white' : 'bg-white text-neutral-900'
                } bg-opacity-90 backdrop-blur-sm`}>
                  With Commentary
                </div>
              </div>
            </div>
          </div>

          {/* Split Layout */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Transcript */}
            <div className={`rounded-xl p-6 ${
              isDarkMode ? 'bg-neutral-900' : 'bg-white'
            } border ${isDarkMode ? 'border-neutral-800' : 'border-neutral-200'}`}>
              <h3 className="text-lg font-semibold mb-4">Live Commentary</h3>
              <div className="max-h-64 overflow-y-auto">
                <p className={`text-sm leading-relaxed font-mono ${
                  isDarkMode ? 'text-neutral-300' : 'text-neutral-600'
                }`}>
                  {result.commentary || 'Your highlight just got the prime-time treatment!'}
                </p>
              </div>
            </div>

            {/* Audio Player & Actions */}
            <div className="space-y-6">
              {result.audioUrl && (
                <div className={`rounded-xl p-6 ${
                  isDarkMode ? 'bg-neutral-900' : 'bg-white'
                } border ${isDarkMode ? 'border-neutral-800' : 'border-neutral-200'}`}>
                  <h3 className="text-lg font-semibold mb-4">Voice Track</h3>
                  <audio controls className="w-full">
                    <source src={result.audioUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                  
                  {/* Download/Share buttons */}
                  <div className="flex gap-3 mt-4">
                    <button className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
                      Download
                    </button>
                    <button className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      isDarkMode 
                        ? 'bg-neutral-800 hover:bg-neutral-700 text-white' 
                        : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900'
                    }`}>
                      Share
                    </button>
                  </div>
                </div>
              )}

              {/* Reset */}
              <div className="text-center">
                <button 
                  onClick={handleReset}
                  className="text-red-600 hover:text-red-700 font-medium transition-colors"
                >
                  🔥 Make Another Highlight
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeClasses}`}>
      {/* Theme Toggle */}
      <div className="fixed top-6 right-6 z-50">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-3 rounded-full transition-all duration-300 ${
            isDarkMode 
              ? 'bg-neutral-800 hover:bg-neutral-700 text-yellow-400' 
              : 'bg-white hover:bg-neutral-100 text-neutral-900 shadow-lg'
          }`}
        >
          {isDarkMode ? '🌞' : '🌙'}
        </button>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            className="w-full h-full object-cover opacity-40"
          >
            <source src="/switch-talk-test-videos/68aac64d88cce82e525f1059.mp4" type="video/mp4" />
          </video>
          <div className={`absolute inset-0 ${
            isDarkMode ? 'bg-neutral-950/60' : 'bg-neutral-50/60'
          }`}></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-24 text-center">
          <div className="mb-6">
            <h1 className="text-2xl font-mono lowercase tracking-wider text-red-600 mb-8">
              swishtalk
            </h1>
            <h2 className="text-5xl lg:text-7xl font-bold leading-tight mb-6">
              Turn Any Game Into{' '}
              <span className="bg-gradient-to-r from-red-600 to-yellow-500 bg-clip-text text-transparent">
                Prime-Time Highlights
              </span>
            </h2>
            <p className={`text-xl font-normal max-w-2xl mx-auto mb-8 ${
              isDarkMode ? 'text-neutral-300' : 'text-neutral-600'
            }`}>
              AI-powered basketball commentary — just pick a clip and we&apos;ll narrate your moves like it&apos;s Game 7.
            </p>
            <p className={`text-sm font-medium ${
              isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
            }`}>
              Built for hoopers, powered by AI
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        {/* Video Gallery */}
        <div className="mb-16">
          <h3 className="text-2xl font-semibold mb-2">Pick Your Clip</h3>
          <p className={`text-sm mb-8 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
            Choose the moment that deserves the spotlight
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {videos.map((video) => (
              <div
                key={video.id}
                onClick={() => setSelectedVideo(video.id)}
                className={`group cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                  selectedVideo === video.id
                    ? 'ring-2 ring-red-600 ring-offset-2 ring-offset-transparent'
                    : ''
                }`}
              >
                <div className="relative h-48 rounded-xl overflow-hidden bg-neutral-900 mb-3">
                  <video
                    muted
                    className="w-full h-full object-cover"
                    poster=""
                  >
                    <source src={`/switch-talk-test-videos/${video.filename}`} type="video/mp4" />
                  </video>
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                      <div className="w-0 h-0 border-l-[12px] border-l-neutral-900 border-y-[8px] border-y-transparent ml-1"></div>
                    </div>
                  </div>
                  
                  {/* Selected indicator */}
                  {selectedVideo === video.id && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
                
                <h4 className="font-semibold text-sm mb-1">{video.title}</h4>
                <p className={`text-xs ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  {video.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Commentary Style */}
        <div className="mb-16">
          <h3 className="text-2xl font-semibold mb-2">Choose the Vibe</h3>
          <p className={`text-sm mb-8 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
            Click to preview, then select your commentary style
          </p>
          
          <div className="flex flex-wrap gap-4 justify-start">
            {commentaryStyles.map((style) => (
              <div key={style.id} className="relative group">
                <div className="text-center">
                  {/* Avatar Pill */}
                  <div className="relative mb-3">
                    <button
                      onClick={() => handleStylePreview(style.id)}
                      className={`relative w-20 h-20 rounded-full overflow-hidden border-4 transition-all duration-300 transform hover:scale-105 ${
                        selectedStyle === style.id
                          ? 'border-blue-500 ring-4 ring-blue-500/30'
                          : 'border-white hover:border-neutral-300'
                      } ${previewingStyle === style.id ? 'animate-pulse' : ''}`}
                    >
                      <Image
                        src={style.avatar}
                        alt={style.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Play/Preview Icon Overlay */}
                      <div className={`absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                        previewingStyle === style.id ? 'opacity-100' : ''
                      }`}>
                        <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
                          {previewingStyle === style.id ? (
                            <div className="w-2 h-2 bg-neutral-900 rounded-full animate-pulse"></div>
                          ) : (
                            <div className="w-0 h-0 border-l-[6px] border-l-neutral-900 border-y-[4px] border-y-transparent ml-0.5"></div>
                          )}
                        </div>
                      </div>
                    </button>
                    
                    {/* Selection Ring */}
                    {selectedStyle === style.id && (
                      <div className="absolute -inset-1 rounded-full border-4 border-blue-500 animate-pulse"></div>
                    )}
                  </div>
                  
                  {/* Name and Select Button */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">{style.name}</h4>
                    <button
                      onClick={() => setSelectedStyle(style.id)}
                      className={`px-4 py-1.5 text-xs rounded-full transition-all duration-200 ${
                        selectedStyle === style.id
                          ? 'bg-blue-500 text-white'
                          : isDarkMode
                            ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      {selectedStyle === style.id ? 'Selected' : 'Select'}
                    </button>
                  </div>
                </div>
                
                {/* Tooltip */}
                <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 ${
                  isDarkMode ? 'bg-neutral-800 text-white' : 'bg-neutral-900 text-white'
                }`}>
                  {style.tooltip}
                </div>
              </div>
            ))}
          </div>
          
          {/* Style Description */}
          {selectedStyle && (
            <div className="mt-6 text-center">
              <p className={`text-sm ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                {commentaryStyles.find(s => s.id === selectedStyle)?.description}
              </p>
            </div>
          )}
        </div>

        {/* Duration */}
        <div className="mb-16">
          <h3 className="text-2xl font-semibold mb-2">Set the Length</h3>
          <p className={`text-sm mb-8 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
            How long should your highlight be?
          </p>
          
          <div className="max-w-32">
            <div className="relative">
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min="1"
                max="300"
                className={`w-full px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-300 ${
                  isDarkMode
                    ? 'bg-neutral-900 border-neutral-800 text-white focus:border-red-600'
                    : 'bg-white border-neutral-200 text-neutral-900 focus:border-red-600'
                } focus:outline-none focus:ring-2 focus:ring-red-600/20`}
              />
              <span className={`absolute right-2 top-1/2 transform -translate-y-1/2 text-xs ${
                isDarkMode ? 'text-neutral-400' : 'text-neutral-600'
              }`}>
                s
              </span>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="mb-8">
          {isGenerating ? (
            <div className="text-center">
              <div className={`max-w-md mx-auto p-8 rounded-xl ${
                isDarkMode ? 'bg-neutral-900' : 'bg-white'
              } border ${isDarkMode ? 'border-neutral-800' : 'border-neutral-200'}`}>
                <div className="mb-4">
                  <div className="text-2xl mb-2">🔥</div>
                  <h4 className="font-semibold mb-2">Building your moment...</h4>
                  <p className={`text-sm ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}>
                    AI is crafting your prime-time commentary
                  </p>
                </div>
                
                {/* Progress bar */}
                <div className={`w-full h-2 rounded-full ${
                  isDarkMode ? 'bg-neutral-800' : 'bg-neutral-200'
                } overflow-hidden`}>
                  <div 
                    className="h-full bg-gradient-to-r from-red-600 to-yellow-500 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-xs mt-2 font-mono">{Math.round(progress)}%</p>
              </div>
            </div>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={!selectedVideo || !selectedStyle}
              className={`w-full py-6 rounded-xl font-semibold text-lg transition-all duration-300 ${
                !selectedVideo || !selectedStyle
                  ? isDarkMode
                    ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-600 to-yellow-500 hover:from-red-700 hover:to-yellow-600 text-white transform hover:scale-105 shadow-lg hover:shadow-xl'
              }`}
            >
              🔥 Generate My Commentary
            </button>
          )}
        </div>
      </div>
    </div>
  );
}