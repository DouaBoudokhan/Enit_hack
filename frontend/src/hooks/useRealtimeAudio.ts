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

type VoiceLogLevel = "info" | "warn" | "error";

function logToServer(level: VoiceLogLevel, message: string, details?: Record<string, unknown>) {
  fetch("/api/voice-client-log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ level, message, details }),
  }).catch((error) => {
    console.warn("[Voice] Could not send log to backend:", error);
  });
}

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

  const disconnect = useCallback((nextState: VoiceState = "idle") => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    stopAudio();
    setState(nextState);
    stateRef.current = nextState;
  }, [stopAudio]);

  const initSession = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    // Configure the AI Persona
    const sessionUpdate = {
      type: "session.update",
      session: {
        voice: "alloy", // expresssive voice
        instructions: "You are 'Our Agent', the coolest, friendliest, and most dynamic Tunisian AI assistant. You are the user's 'Digital Friend'.\n\nPERSONALITY:\n- Tone: Warm, helpful, slightly witty, and very responsive.\n- Language: Speak mainly in English, but you can mix in some Tunisian Arabic (Derja) expressions for flavor (e.g., 'Behi', 'Yaatik saha').\n- Style: Professional yet friendly. You are an expert in Tunisian influencer intelligence.\n\nBEHAVIOR:\n- If the user interrupts you, stop immediately.\n- If you need to perform a search, don't stay silent. Say something like 'Sure, let me check that for you...' before calling the tool.\n\nMISSION: You help the user analyze the world of Tunisian influencers. Be an expert but stay their friend.\n\nIMPORTANT: You MUST ALWAYS give a vocal confirmation BEFORE launching the 'investigate_influencer' tool.",
        turn_detection: {
          type: "server_vad",
          threshold: 0.5, // More sensitive speech detection
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
      // Fallback, but it should ideally be created in startMic
      playbackContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextPlayTimeRef.current = playbackContextRef.current.currentTime;
    }
    const ctx = playbackContextRef.current;
    
    // Explicitly resume to bypass autoplay restrictions
    if (ctx.state === "suspended") {
      ctx.resume().catch(e => console.error("Could not resume audio context:", e));
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

      // Initialize playback context here to bind it to the user gesture (click)
      if (!playbackContextRef.current) {
        playbackContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        nextPlayTimeRef.current = playbackContextRef.current.currentTime;
      }

      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (stateRef.current === "investigating") return;
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        
        // Ensure context is running (fixes issues where it starts suspended)
        if (ctx.state === "suspended") ctx.resume();

        const inputData = e.inputBuffer.getChannelData(0);
        
        // Debug: Log if we are getting actual audio levels (not just silence)
        const maxVal = Math.max(...Array.from(inputData).map(Math.abs));
        if (maxVal > 0.05) {
           console.log("[Voice] 🎙️ Audio activity detected, max level:", maxVal.toFixed(3));
        }

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
      logToServer("error", "Microphone access denied", { error: String(e) });
      setState("error");
      disconnect("error");
    }
  }, [disconnect]);

  const connect = useCallback(() => {
    if (!WS_URL) {
      console.error("Missing realtime configuration. Set VITE_AZURE_REALTIME_ENDPOINT and VITE_AZURE_REALTIME_API_KEY.");
      logToServer("error", "Missing realtime configuration", {
        has_endpoint: Boolean(ENDPOINT),
        has_api_key: Boolean(API_KEY),
        deployment: DEPLOYMENT,
        api_version: API_VERSION,
      });
      setState("error");
      stateRef.current = "error";
      return;
    }

    console.log("[Voice] Connecting to Azure Realtime...");
    console.log("[Voice] Endpoint:", ENDPOINT);
    console.log("[Voice] Deployment:", DEPLOYMENT);
    logToServer("info", "Connecting to Azure Realtime", {
      endpoint: ENDPOINT,
      deployment: DEPLOYMENT,
      api_version: API_VERSION,
    });
    setState("connecting");
    stateRef.current = "connecting";
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[Voice] ✅ WebSocket connected!");
      logToServer("info", "WebSocket connected");
      setState("listening");
      stateRef.current = "listening";
      initSession();
      startMic();
    };

    ws.onmessage = (e) => {
      let msg: { type?: string; [key: string]: unknown };
      try {
        const parsed = JSON.parse(e.data);
        if (!parsed || typeof parsed !== "object") {
          throw new Error("Message is not an object");
        }
        msg = parsed as { type?: string; [key: string]: unknown };
      } catch (error) {
        console.error("[Voice] Invalid WS message payload:", e.data);
        logToServer("error", "Invalid WS message payload", { error: String(error) });
        return;
      }
      // Log all message types for debugging
      if (msg.type !== "response.audio.delta" && msg.type !== "input_audio_buffer.append") {
        console.log("[Voice] 📩 Received:", msg.type, msg.type === "error" ? String(msg.error ?? "") : "");
      }
      switch(msg.type) {
        case "session.created":
          console.log("[Voice] ✅ Session created successfully");
          logToServer("info", "Realtime session created");
          break;
        case "session.updated":
          console.log("[Voice] ✅ Session configured");
          logToServer("info", "Realtime session updated");
          break;
        case "response.audio.delta":
          if (typeof msg.delta === "string" && msg.delta) {
            setState("speaking");
            stateRef.current = "speaking";
            startPlayback(msg.delta);
          }
          break;
        case "input_audio_buffer.speech_started":
          console.log("[Voice] 🎤 Speech detected!");
          interruptPlayback();
          setState("listening");
          stateRef.current = "listening";
          break;
        case "response.function_call_arguments.done":
          if (msg.name === "investigate_influencer" && typeof msg.arguments === "string") {
            let args: { influencer_name?: string; specific_query?: string };
            try {
              args = JSON.parse(msg.arguments) as { influencer_name?: string; specific_query?: string };
            } catch (error) {
              logToServer("error", "Failed to parse function call arguments", { error: String(error) });
              break;
            }
            const influencerName = args.influencer_name?.trim();
            const specificQuery = args.specific_query?.trim();
            const callId = typeof msg.call_id === "string" ? msg.call_id : "";
            if (!influencerName || !callId) {
              logToServer("error", "Invalid function call arguments", {
                influencer_name: influencerName ?? "",
                has_call_id: Boolean(callId),
              });
              break;
            }
            setState("investigating");
            stateRef.current = "investigating";
            logToServer("info", "Tool call triggered", {
              tool: "investigate_influencer",
              influencer_name: influencerName,
            });
            
            fetch("/api/investigate-influencer", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                influencer_name: influencerName,
                specific_query: specificQuery || "Analyse complète et générale"
              })
            })
            .then(res => res.json())
            .then(data => {
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                  type: "conversation.item.create",
                  item: {
                    type: "function_call_output",
                    call_id: callId,
                    output: data.report
                  }
                }));
                wsRef.current.send(JSON.stringify({ type: "response.create" }));
              }
              logToServer("info", "Investigation completed", {
                influencer_name: influencerName,
              });
            })
            .catch(err => {
              logToServer("error", "Investigation failed", { error: String(err) });
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                  type: "conversation.item.create",
                  item: {
                    type: "function_call_output",
                    call_id: callId,
                    output: "Désolé, la recherche a échoué à cause d'une erreur réseau."
                  }
                }));
                wsRef.current.send(JSON.stringify({ type: "response.create" }));
              }
            });
          }
          break;
        case "error":
          console.error("[Voice] ❌ Azure OpenAI Error:", msg.error);
          logToServer("error", "Azure Realtime error", { error: String(msg.error ?? "unknown") });
          break;
      }
    };

    ws.onerror = (e) => {
      console.error("[Voice] ❌ WebSocket Error:", e);
      logToServer("error", "WebSocket error");
      setState("error");
      disconnect("error");
    };

    ws.onclose = (e) => {
      console.log("[Voice] WebSocket closed. Code:", e.code, "Reason:", e.reason);
      logToServer("warn", "WebSocket closed", { code: e.code, reason: e.reason });
      disconnect(stateRef.current === "error" ? "error" : "idle");
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
