import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceChatScreenProps {
  onClose: () => void;
}

// TODO: Replace with your actual ElevenLabs API key and voice ID
const ELEVENLABS_API_KEY = 'sk_9536c0deac30b0b11b9fc03ebd6d5c3fad14baddc208913e';
const ELEVENLABS_VOICE_ID = 'gOkFV1JMCt0G0n9xmBwV'; // e.g., "EXAVITQu4vr4xnSDxMaL" for default

export const VoiceChatScreen: React.FC<VoiceChatScreenProps> = ({ onClose }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userText, setUserText] = useState('');
  const userTextRef = useRef('');
  const [aiText, setAiText] = useState('');
  const recognitionRef = useRef<any>(null);
  const [conversation, setConversation] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [maleVoice, setMaleVoice] = useState<SpeechSynthesisVoice | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Select a deep male voice on mount (for fallback browser TTS)
  useEffect(() => {
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      let deepMale = voices.find(v =>
        v.lang.startsWith('en') &&
        (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('barry') || v.name.toLowerCase().includes('fred') || v.name.toLowerCase().includes('george'))
      );
      if (!deepMale) {
        deepMale = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('male'));
      }
      if (!deepMale) {
        deepMale = voices.find(v => v.lang.startsWith('en'));
      }
      setMaleVoice(deepMale || null);
    };
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = pickVoice;
    } else {
      pickVoice();
    }
  }, []);

  // Start/stop listening
  useEffect(() => {
    if (!isListening) {
      recognitionRef.current?.stop();
      return;
    }
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      setIsListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; // Change to 'hi-IN' for Hindi
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      setUserText(transcript);
      userTextRef.current = transcript;
    };
    recognition.onend = () => {
      setIsListening(false);
      const finalTranscript = userTextRef.current.trim();
      if (finalTranscript) {
        setConversation((prev) => [...prev, { role: 'user', text: finalTranscript }]);
        fetchAIResponse(finalTranscript);
        setUserText('');
        userTextRef.current = '';
      } else {
        setIsListening(true);
      }
    };
    recognition.onerror = () => {
      setIsListening(false);
      setIsListening(true);
    };
    recognitionRef.current = recognition;
    recognition.start();
    // eslint-disable-next-line
  }, [isListening]);

  // Fetch AI response and speak it (with space-fix logic)
  const fetchAIResponse = async (text: string) => {
    setIsSpeaking(true);
    setAiText('');
    try {
      const response = await fetch('/accord-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'accord-gpt-01',
          language: 'en', // Add language if needed
          messages: [
            { role: 'accord-user', content: text },
          ],
        }),
      });
      if (!response.ok) throw new Error('API error');
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let lastChunkEndedWithSpace = true;
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;
              try {
                const parsed = JSON.parse(data);
                if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
                  const delta = parsed.choices[0].delta;
                  if (delta.content) {
                    let contentToAdd = delta.content;
                    if (!lastChunkEndedWithSpace && !contentToAdd.startsWith(' ') &&
                        !contentToAdd.match(/^[.,!?;:]/) &&
                        !contentToAdd.match(/^['"`]/)) {
                      contentToAdd = ' ' + contentToAdd;
                    }
                    accumulated += contentToAdd;
                    lastChunkEndedWithSpace = contentToAdd.endsWith(' ') || contentToAdd.match(/[.,!?;:]$/);
                    setAiText(accumulated);
                  }
                }
              } catch {}
            }
          }
        }
      }
      // Speak the full response with ElevenLabs
      if (accumulated) {
        await speakTextWithElevenLabs(accumulated);
        setConversation((prev) => [...prev, { role: 'assistant', text: accumulated }]);
      } else {
        setIsListening(true);
      }
    } catch {
      setAiText('Sorry, I could not get a response.');
      setIsSpeaking(false);
      setIsListening(true);
    }
  };

  // Speak text using ElevenLabs TTS
  const speakTextWithElevenLabs = async (text: string) => {
    try {
      const url = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      });
      if (!response.ok) throw new Error('TTS error');
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => {
        setIsSpeaking(false);
        setIsListening(true);
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        setIsListening(true);
      };
      audio.play();
    } catch {
      setIsSpeaking(false);
      setIsListening(true);
    }
  };

  // Start the conversation loop on mount
  useEffect(() => {
    setTimeout(() => setIsListening(true), 500);
    // eslint-disable-next-line
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Large animated avatar */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className={`w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-2xl mb-6 sm:mb-8 md:mb-12 ${isListening ? 'animate-pulse' : ''}`}>
          <svg className="w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 15s1.5 2 4 2 4-2 4-2" />
            <circle cx="9" cy="10" r="1" />
            <circle cx="15" cy="10" r="1" />
          </svg>
        </div>
        
        {/* Visual cues */}
        {isListening && (
          <div className="text-purple-600 text-base sm:text-lg font-semibold mb-3 sm:mb-4 animate-pulse">
            Listening…
          </div>
        )}
        {isSpeaking && (
          <div className="text-purple-600 text-base sm:text-lg font-semibold mb-3 sm:mb-4">
            Speaking…
          </div>
        )}
        
        {/* Show last user/AI message */}
        <div className="text-center text-sm sm:text-base md:text-lg text-gray-700 min-h-[36px] sm:min-h-[48px] max-w-xs sm:max-w-md md:max-w-xl mx-auto mb-4 px-4">
          {isListening && userText && (
            <p className="leading-relaxed">{userText}</p>
          )}
          {isSpeaking && aiText && (
            <p className="leading-relaxed">{aiText}</p>
          )}
        </div>
      </div>
      
      {/* Mic and close buttons */}
      <div className="flex gap-4 sm:gap-6 pb-6 sm:pb-8 md:pb-12">
        <button
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full ${
            isListening ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-600'
          } flex items-center justify-center shadow-lg hover:bg-blue-200 transition touch-target ${
            isSpeaking ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title={isListening ? 'Stop Listening' : 'Start Listening'}
          onClick={() => setIsListening((v) => !v)}
          disabled={isSpeaking}
        >
          {isListening ? (
            <MicOff size={24} className="sm:w-8 sm:h-8" />
          ) : (
            <Mic size={24} className="sm:w-8 sm:h-8" />
          )}
        </button>
        <button 
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shadow-lg hover:bg-slate-200 transition touch-target" 
          title="Close Voice Chat" 
          onClick={onClose}
        >
          <span className="text-2xl sm:text-3xl">×</span>
        </button>
      </div>
    </div>
  );
}; 