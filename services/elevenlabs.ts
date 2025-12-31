
const API_KEY = (import.meta as any).env.VITE_ELEVENLABS_API_KEY;
const BASE_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

// "Charlie" - a calm, professional voice suitable for career coaching
const DEFAULT_VOICE_ID = 'IKne3meq5aSn9XLyUdCD'; 

let currentAudio: HTMLAudioElement | null = null;

export const elevenLabsService = {
  /**
   * Streams text to speech using ElevenLabs
   * @param text The text to speak
   * @param onEnd Callback when audio finishes
   */
  speak: async (text: string, onEnd?: () => void) => {
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
      // clean markdown asterisks for smoother reading
      const cleanText = text.replace(/\*\*/g, '').replace(/#/g, '');

      const response = await fetch(`${BASE_URL}/${DEFAULT_VOICE_ID}`, {
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
