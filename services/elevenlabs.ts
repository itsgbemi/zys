
const API_KEY = (import.meta as any).env.VITE_ELEVENLABS_API_KEY;
const BASE_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

// Available Voices for Zysculpt
export const AVAILABLE_VOICES = [
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', gender: 'Male', description: 'Calm, Professional (Default)' },
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', gender: 'Female', description: 'American, Clear, Narration' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', gender: 'Female', description: 'Strong, Professional' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', gender: 'Male', description: 'Well-rounded, American' }
];

// Default to Charlie
const DEFAULT_VOICE_ID = 'IKne3meq5aSn9XLyUdCD'; 

let currentAudio: HTMLAudioElement | null = null;

export const elevenLabsService = {
  getVoices: () => AVAILABLE_VOICES,

  /**
   * Streams text to speech using ElevenLabs
   * @param text The text to speak
   * @param onEnd Callback when audio finishes
   * @param voiceId Optional specific voice ID (overrides default)
   */
  speak: async (text: string, onEnd?: () => void, voiceId?: string) => {
    if (!API_KEY) {
      console.warn("ElevenLabs API Key missing. Set VITE_ELEVENLABS_API_KEY in .env");
      alert("Voice features require an ElevenLabs API Key in settings.");
      if (onEnd) onEnd();
      return;
    }

    // Stop any currently playing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }

    try {
      const selectedVoice = voiceId || DEFAULT_VOICE_ID;
      
      // clean markdown asterisks for smoother reading
      const cleanText = text.replace(/\*\*/g, '').replace(/#/g, '');

      const response = await fetch(`${BASE_URL}/${selectedVoice}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': API_KEY,
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('ElevenLabs Error:', errorData);
        throw new Error('ElevenLabs API request failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      currentAudio = new Audio(url);
      currentAudio.onended = () => {
        currentAudio = null;
        if (onEnd) onEnd();
      };
      
      await currentAudio.play();

    } catch (error) {
      console.error('Error generating speech:', error);
      alert("Failed to play audio. Check console for details (API Key or Network).");
      if (onEnd) onEnd();
    }
  },

  /**
   * Stops the currently playing audio
   */
  stop: () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
  },

  /**
   * Check if audio is currently playing
   */
  isPlaying: () => !!currentAudio
};
