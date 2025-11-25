
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { createPcmBlob, decode, decodeAudioData, downsampleTo16k } from './audioUtils';
import { LANGUAGES } from '../constants';
import { LanguageCode } from '../types';

export class LiveTranslator {
  private sessionPromise: Promise<any> | null = null;
  private inputContext: AudioContext | null = null;
  private outputContext: AudioContext | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private nextStartTime: number = 0;
  private stream: MediaStream | null = null;
  
  private onStatusChange: (status: string) => void;
  private onError: (error: string) => void;
  private onAudioLevel: (level: number) => void;
  private onTranscript: (text: string, isUser: boolean, isFinal: boolean) => void;

  private currentInputTranscription = '';
  private currentOutputTranscription = '';

  constructor(
    onStatusChange: (status: string) => void,
    onError: (error: string) => void,
    onAudioLevel: (level: number) => void,
    onTranscript: (text: string, isUser: boolean, isFinal: boolean) => void
  ) {
    this.onStatusChange = onStatusChange;
    this.onError = onError;
    this.onAudioLevel = onAudioLevel;
    this.onTranscript = onTranscript;
  }

  // Robust cleanup of tags
  private cleanText(text: string): string {
    return text
      .replace(/<[^>]+>/g, '') // Remove <tags>
      .replace(/\[[^\]]+\]/g, '') // Remove [notes]
      .replace(/\([^)]+\)/g, '') // Remove (parentheses)
      .replace(/\*/g, '') // Remove asterisks
      .trim();
  }

  async connect(nativeLangCode: LanguageCode, targetLangCode: LanguageCode, uniqueSessionId: string) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      this.onError("Erro: API Key não encontrada.");
      return;
    }

    // Always create a fresh instance to ensure clean state
    const ai = new GoogleGenAI({ apiKey });

    const nativeLang = LANGUAGES.find(l => l.code === nativeLangCode);
    const targetLang = LANGUAGES.find(l => l.code === targetLangCode);

    try {
      this.onStatusChange("connecting");

      // 1. Initialize Audio Contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.inputContext = new AudioContextClass({ sampleRate: 16000 }); // Native rate for input preference
      this.outputContext = new AudioContextClass({ sampleRate: 24000 }); // High quality output
      
      // 2. Force Resume (Crucial for mobile/suspended states)
      await Promise.all([
        this.inputContext.state === 'suspended' ? this.inputContext.resume() : Promise.resolve(),
        this.outputContext.state === 'suspended' ? this.outputContext.resume() : Promise.resolve()
      ]);

      // 3. Get User Media with Hardware Echo Cancellation
      // We rely on the browser/OS to handle echo. Software gating is too error-prone.
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true, 
          autoGainControl: true,
          channelCount: 1
        } 
      });
      
      const config = {
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO], 
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: `Session ID: ${uniqueSessionId}.
          Act as a professional real-time interpreter.
          Translate spoken audio between ${nativeLang?.name} and ${targetLang?.name}.
          Your output must be ONLY the translated audio.
          Do not add conversational filler.
          If the user stops speaking, translate immediately.`,
        },
      };

      this.sessionPromise = ai.live.connect({
        model: config.model,
        callbacks: {
          onopen: () => {
            this.onStatusChange("connected");
            this.startAudioInput();
          },
          onmessage: async (message: LiveServerMessage) => {
            await this.handleServerMessage(message);
          },
          onclose: () => {
            this.onStatusChange("disconnected");
          },
          onerror: (err) => {
            console.error("Gemini Live Error:", err);
            const msg = err instanceof Error ? err.message : String(err);
            // Ignore common harmless network blips, only show real disconnects
            if (!msg.includes("fetch")) {
                this.onError("Conexão instável. Reconectando...");
            }
          }
        },
        config: config.config
      });

    } catch (err: any) {
      console.error("Connect Exception:", err);
      this.onError("Erro ao iniciar áudio. Verifique permissões.");
      this.disconnect();
    }
  }

  private startAudioInput() {
    if (!this.inputContext || !this.stream || !this.sessionPromise) return;

    this.inputSource = this.inputContext.createMediaStreamSource(this.stream);
    
    // Buffer size 2048 = ~40ms latency at 48kHz. Good balance.
    this.scriptProcessor = this.inputContext.createScriptProcessor(2048, 1, 1);

    this.scriptProcessor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      
      // 1. Simple RMS for visualization only (not for logic gating)
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
      const rms = Math.sqrt(sum / inputData.length);
      this.onAudioLevel(rms);

      // 2. Always resample and send. 
      // We removed the "rms > threshold" gate.
      // We let Gemini's VAD decide when silence happens. 
      // This fixes the "AI doesn't respond" issue when you speak quietly.
      if (this.inputContext) {
        const resampledData = downsampleTo16k(inputData, this.inputContext.sampleRate);
        const pcmBlob = createPcmBlob(resampledData);
        
        this.sessionPromise!.then((session) => {
             session.sendRealtimeInput({ media: pcmBlob });
        }).catch(() => {
            // Swallow send errors to prevent crash loops
        });
      }
    };

    this.inputSource.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.inputContext.destination);
  }

  private async handleServerMessage(message: LiveServerMessage) {
    const serverContent = message.serverContent;

    // --- Audio Output ---
    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;

    if (base64Audio && this.outputContext) {
      try {
        const audioBuffer = await decodeAudioData(
            decode(base64Audio),
            this.outputContext,
            24000, 
            1
        );

        // Drift Correction: If we are behind, jump to now.
        const currentTime = this.outputContext.currentTime;
        if (this.nextStartTime < currentTime) {
            this.nextStartTime = currentTime;
        }

        const source = this.outputContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.outputContext.destination);
        source.start(this.nextStartTime);
        this.nextStartTime += audioBuffer.duration;

      } catch (e) {
        console.error("Audio decode error", e);
      }
    }

    // --- Transcription ---
    if (serverContent) {
        if (serverContent.outputTranscription) {
            const rawText = serverContent.outputTranscription.text;
            if (rawText) {
                this.currentOutputTranscription += rawText;
                const clean = this.cleanText(this.currentOutputTranscription);
                if (clean) this.onTranscript(clean, false, false);
            }
        } else if (serverContent.inputTranscription) {
            const rawText = serverContent.inputTranscription.text;
            if (rawText) {
                this.currentInputTranscription += rawText;
                const clean = this.cleanText(this.currentInputTranscription);
                if (clean) this.onTranscript(clean, true, false);
            }
        }

        if (serverContent.turnComplete) {
            if (this.currentInputTranscription.trim()) {
                const clean = this.cleanText(this.currentInputTranscription);
                if (clean) this.onTranscript(clean, true, true);
            }
            this.currentInputTranscription = '';

            if (this.currentOutputTranscription.trim()) {
                const clean = this.cleanText(this.currentOutputTranscription);
                if (clean) this.onTranscript(clean, false, true);
            }
            this.currentOutputTranscription = '';
        }
    }

    if (message.serverContent?.interrupted) {
       // Reset timing on interruption
       this.nextStartTime = this.outputContext ? this.outputContext.currentTime : 0;
       this.currentInputTranscription = '';
       this.currentOutputTranscription = '';
    }
  }

  async disconnect() {
    // Reset state
    this.currentInputTranscription = '';
    this.currentOutputTranscription = '';
    
    // Close Session
    if (this.sessionPromise) {
       const s = await this.sessionPromise;
       if (s) {
           // We try/catch close because sometimes the socket is already dead
           try { s.close(); } catch(e) {}
       }
    }
    this.sessionPromise = null;
    
    // Stop Tracks
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    // Clean Nodes
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor.onaudioprocess = null;
      this.scriptProcessor = null;
    }
    
    if (this.inputSource) {
      this.inputSource.disconnect();
      this.inputSource = null;
    }

    // Close Contexts
    if (this.inputContext && this.inputContext.state !== 'closed') {
       await this.inputContext.close();
    }
    this.inputContext = null;

    if (this.outputContext && this.outputContext.state !== 'closed') {
      await this.outputContext.close();
    }
    this.outputContext = null;

    this.onStatusChange("disconnected");
  }
}
