import { useState, useRef, useCallback, useEffect } from "react";
import { float32ToPcm16Base64, base64Pcm16ToFloat32 } from "@/lib/audioUtils";

export type VoiceState = "idle" | "connecting" | "listening" | "speaking" | "investigating" | "error";

const ENDPOINT = (import.meta.env.VITE_AZURE_REALTIME_ENDPOINT ?? "").trim();
const API_VERSION = (import.meta.env.VITE_AZURE_REALTIME_API_VERSION ?? "2024-10-01-preview").trim();
const DEPLOYMENT = (import.meta.env.VITE_AZURE_REALTIME_DEPLOYMENT ?? "gpt-realtime").trim();
// IMPORTANT: Using query param for api-key since browsers don't support custom headers in WebSockets
const API_KEY = (import.meta.env.VITE_AZURE_REALTIME_API_KEY ?? "").trim();

const WS_URL = ENDPOINT && API_KEY
  ? `${ENDPOINT}?api-version=${encodeURIComponent(API_VERSION)}&deployment=${encodeURIComponent(DEPLOYMENT)}&api-key=${encodeURIComponent(API_KEY)}`
  : "";

export function useRealtimeAudio() {
  const [state, setState] = useState<VoiceState>("idle");
  const stateRef = useRef<VoiceState>("idle");
  const wsRef = useRef<WebSocket | null>(null);
  
  // Audio Input (Mic)
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  
  // Audio Output (Speaker)
  const playbackContextRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const sourceNodesRef = useRef<AudioBufferSourceNode[]>([]); // To track playing nodes for interruption

  const stopAudio = useCallback(() => {
    // Stop mic
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop playback
    sourceNodesRef.current.forEach(node => {
      try { node.stop(); } catch(e) {}
      try { node.disconnect(); } catch(e) {}
    });
    sourceNodesRef.current = [];
    
    if (playbackContextRef.current) {
      playbackContextRef.current.close();
      playbackContextRef.current = null;
    }
    nextPlayTimeRef.current = 0;
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    stopAudio();
    setState("idle");
    stateRef.current = "idle";
  }, [stopAudio]);

  const initSession = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    // Configure the AI Persona
    const sessionUpdate = {
      type: "session.update",
      session: {
        voice: "alloy", // expresssive voice
        instructions: "Tu es 'Sarra', l'assistant IA tunisien le plus cool, amical et dynamique. Tu es le 'Digital Friend' de l'utilisateur. \n\nPERSONNALITÉ :\n- Ton : Chaleureux, complice, un peu impertinent (humour tunisien), et très réactif.\n- Langue : Parle principalement en Derja tunisienne mixée avec du français (le 'parler tunisien' naturel). \n- Style : Utilise des expressions comme 'Behi sahabi', 'Asmaa asmaa', 'Yaatik saha', 'Mela lz'. \n- Réaction au bruit : Si tu entends du bruit bizarre, ne réagis pas, attends que l'utilisateur te parle clairement.\n\nCOMPORTEMENT VOIX & ÉMOTIONS :\n- Sois expressif : Ris si l'utilisateur dit quelque chose de drôle. \n- Interruption : Si l'utilisateur te coupe, arrête-toi tout de suite gentiment.\n- Temps de réflexion : Si tu dois faire une recherche, ne reste pas silencieux. Dis quelque chose de naturel en Derja avant d'appeler l'outil (ex: 'D'accord, khalini nthabetlek chwaya...', 'Ok, hani nlawejlek, asber aalia dkihka...').\n\nMISSION : Tu aides l'utilisateur à analyser le monde des influenceurs tunisiens. Sois un expert mais reste ton ami.\n\nIMPORTANT : Tu DOIS TOUJOURS donner une confirmation vocale AVANT de lancer l'outil 'investigate_influencer'. Ne lance jamais la recherche en silence.",
        turn_detection: {
          type: "server_vad",
          threshold: 0.75, // Better noise rejection for street/background noise
          prefix_padding_ms: 300,
          silence_duration_ms: 850 // More relaxed conversational pace for dialectal pauses
        },
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        tools: [
          {
            type: "function",
            name: "investigate_influencer",
            description: "Recherche en temps réel toutes les informations publiques sur un influenceur (biographie, followers, controverses, collaborations) en utilisant un agent d'intelligence OSINT (Web Scraping). Déclenche ceci UNIQUEMENT si l'utilisateur demande explicitement d'enquêter, de rechercher ou de donner des informations détaillées sur un influenceur spécifique.",
            parameters: {
              type: "object",
              properties: {
                influencer_name: { type: "string", description: "Le nom complet de l'influenceur à rechercher." },
                specific_query: { type: "string", description: "La question ou le détail spécifique que l'utilisateur veut savoir sur cet influenceur (ex: 'quelles sont ses polémiques', 'est-ce qu'elle a fait des pubs pour des parfums'). Laisse vide si la demande est générale." }
              },
              required: ["influencer_name"]
            }
          }
        ],
        tool_choice: "auto"
      }
    };
    wsRef.current.send(JSON.stringify(sessionUpdate));
  }, []);

  const startPlayback = useCallback((base64Audio: string) => {
    if (!playbackContextRef.current) {
      playbackContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextPlayTimeRef.current = playbackContextRef.current.currentTime;
    }
    const ctx = playbackContextRef.current;
    
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const float32Data = base64Pcm16ToFloat32(base64Audio);
    const buffer = ctx.createBuffer(1, float32Data.length, 24000);
    buffer.copyToChannel(float32Data, 0);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    // Schedule playback sequentially
    const startTime = Math.max(nextPlayTimeRef.current, ctx.currentTime);
    source.start(startTime);
    
    nextPlayTimeRef.current = startTime + buffer.duration;
    
    sourceNodesRef.current.push(source);
    source.onended = () => {
      sourceNodesRef.current = sourceNodesRef.current.filter(n => n !== source);
      if (sourceNodesRef.current.length === 0) {
        // Playback finished, return to listening state if we were speaking
        setState(prev => {
          const next = prev === "speaking" ? "listening" : prev;
          stateRef.current = next;
          return next;
        });
      }
    };
  }, []);

  const interruptPlayback = useCallback(() => {
    // When the user starts speaking, stop all AI playback
    sourceNodesRef.current.forEach(node => {
      try { node.stop(); } catch(e) {}
      try { node.disconnect(); } catch(e) {}
    });
    sourceNodesRef.current = [];
    if (playbackContextRef.current) {
      nextPlayTimeRef.current = playbackContextRef.current.currentTime;
    }
  }, []);

  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        // Mute the microphone during investigation
        if (stateRef.current === "investigating") return;
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Very basic silence detection (optional, but server_vad handles it)
        // We just send everything when listening.
        const base64Audio = float32ToPcm16Base64(inputData);
        
        wsRef.current.send(JSON.stringify({
          type: "input_audio_buffer.append",
          audio: base64Audio
        }));
      };

      source.connect(processor);
      processor.connect(ctx.destination);
    } catch (e) {
      console.error("Microphone access denied:", e);
      setState("error");
      disconnect();
    }
  }, [disconnect]);

  const connect = useCallback(() => {
    if (!WS_URL) {
      console.error("Missing realtime configuration. Set VITE_AZURE_REALTIME_ENDPOINT and VITE_AZURE_REALTIME_API_KEY.");
      setState("error");
      stateRef.current = "error";
      return;
    }

    setState("connecting");
    stateRef.current = "connecting";
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setState("listening");
      stateRef.current = "listening";
      initSession();
      startMic();
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      switch(msg.type) {
        case "response.audio.delta":
          if (msg.delta) {
            setState("speaking");
            stateRef.current = "speaking";
            startPlayback(msg.delta);
          }
          break;
        case "input_audio_buffer.speech_started":
          // User started talking, interrupt the AI playback!
          interruptPlayback();
          setState("listening");
          stateRef.current = "listening";
          break;
        case "response.function_call_arguments.done":
          if (msg.name === "investigate_influencer") {
            const args = JSON.parse(msg.arguments);
            setState("investigating");
            stateRef.current = "investigating";
            
            fetch("http://localhost:8000/api/investigate-influencer", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                influencer_name: args.influencer_name,
                specific_query: args.specific_query || "Analyse complète et générale"
              })
            })
            .then(res => res.json())
            .then(data => {
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                  type: "conversation.item.create",
                  item: {
                    type: "function_call_output",
                    call_id: msg.call_id,
                    output: data.report
                  }
                }));
                wsRef.current.send(JSON.stringify({ type: "response.create" }));
              }
            })
            .catch(err => {
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                  type: "conversation.item.create",
                  item: {
                    type: "function_call_output",
                    call_id: msg.call_id,
                    output: "Désolé, la recherche a échoué à cause d'une erreur réseau."
                  }
                }));
                wsRef.current.send(JSON.stringify({ type: "response.create" }));
              }
            });
          }
          break;
        case "error":
          console.error("Azure OpenAI Error:", msg.error);
          break;
      }
    };

    ws.onerror = (e) => {
      console.error("WebSocket Error:", e);
      setState("error");
      disconnect();
    };

    ws.onclose = () => {
      disconnect();
    };
  }, [initSession, startMic, startPlayback, interruptPlayback, disconnect]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { state, connect, disconnect };
}
