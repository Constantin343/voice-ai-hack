'use client'

import React, { useState, useEffect, useRef } from 'react'
import { RetellWebClient } from "retell-client-js-sdk";
import { Loader2 } from "lucide-react"
import AnimatedLogo from '../AnimatedLogo'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'

interface OnboardingAgentProps {
  isSpeaking: boolean;
  onboardingAgentId: string;
  onProcessed: () => void;
}

export const OnboardingAgent: React.FC<OnboardingAgentProps> = ({ 
  isSpeaking,
  onboardingAgentId,
  onProcessed 
}) => {
  const retellClientRef = useRef<RetellWebClient | null>(null);
  const [devices, setDevices] = useState<{ audio: MediaDeviceInfo[] }>({ audio: [] });
  const [token, setToken] = useState('');
  const [callId, setCallId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Reuse the audio device setup code from AnimatedAgent
  useEffect(() => {
    async function getAudioDevices() {
      try {
        const constraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        stream.getTracks().forEach(track => track.stop());
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioDevices = devices.filter(device => device.kind === 'audioinput');
        
        if (audioDevices.length === 0) {
          throw new Error('No audio input devices found');
        }
        
        setDevices({ audio: audioDevices });
      } catch (error) {
        console.error("Error accessing audio devices:", error);
      }
    }

    getAudioDevices();
  }, []);

  // Modified token fetch for onboarding
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch('/api/agent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isOnboarding: true, onboarding_agent_id: onboardingAgentId }),
          credentials: 'include',
        });
        
        const data = await response.json();
        
        if (!data.accessToken) {
          throw new Error('No access token received');
        }
        
        setToken(data.accessToken);
        if (data.callId) {
          setCallId(data.callId);
        }
      } catch (error) {
        console.error("Failed to fetch token:", error);
        toast.error('Error', {
          description: 'Failed to initialize onboarding experience.',
        });
        return null;
      }
    };

    if (isSpeaking) {
      fetchToken();
    }
  }, [isSpeaking]);

  // Modified call handling for onboarding
  useEffect(() => {

    const setupRetellCall = async () => {
      try {
        if (!token) {
          return;
        }

        if (!retellClientRef.current) {
          retellClientRef.current = new RetellWebClient();
          
          // Set up event listeners
          retellClientRef.current.on("call_started", () => {
            console.log("🎤 Call started");
          });

          retellClientRef.current.on("call_ended", () => {
            console.log("📞 Call ended");
          });

          retellClientRef.current.on("agent_start_talking", () => {
            console.log("🗣️ Agent started talking");
          });

          retellClientRef.current.on("agent_stop_talking", () => {
            console.log("🤐 Agent stopped talking");
          });

          retellClientRef.current.on("error", (error) => {
            console.error("❌ An error occurred:", error);
            retellClientRef.current?.stopCall();
          });

          // Add transcript handling
          retellClientRef.current.on("update", (update) => {
            if (update.transcript) {
              console.log("📝 Transcript:", update.transcript);
            }
          });
        }

        // Get default audio device with fallback
        const defaultAudioDevice = devices.audio[0]?.deviceId || 'default';

        // Add more detailed logging
        console.log('Starting call with config:', {
          accessToken: token ? 'present' : 'missing',
          deviceId: defaultAudioDevice,
          audioDevices: devices.audio.length
        });

        await retellClientRef.current.startCall({
          accessToken: token,
          sampleRate: 24000,
          captureDeviceId: defaultAudioDevice,
          playbackDeviceId: 'default',
          emitRawAudioSamples: false,
        });

      } catch (error) {
        console.error("Failed to setup Retell call:", error);
        toast.error('Connection failed', {
          description: 'Unable to establish call connection. Please try again.',
        });
      }
    };

    const cleanupCall = async () => {
      console.log('📞 isSpeaking deactivated, stopping call...');
      if (retellClientRef.current) {
        retellClientRef.current.stopCall();
        retellClientRef.current = null;
      }
      
      if (callId) {
        setIsProcessing(true);
        
        try {
          const response = await fetch('/api/agent/persona', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ call_id: callId }),
          });

          if (!response.ok) {
            throw new Error('Failed to process call');
          }

          onProcessed();

        } catch (error) {
          console.error('Error processing persona:', error);
          toast.error('Failed to process response');
        } finally {
          setIsProcessing(false);
          setCallId('');
        }
      }
    };

    if (isSpeaking && devices.audio.length > 0) {
      console.log('🎤 isSpeaking activated, initiating call...');
      setupRetellCall();
      
    } else if (!isSpeaking && retellClientRef.current) {
      cleanupCall();
    }

    return () => {
      if (retellClientRef.current && !isSpeaking) {
        console.log('🧹 Cleanup: Stopping Retell call');
        retellClientRef.current.stopCall();
        retellClientRef.current = null;
      }
    };

    // ... Rest of the effect code similar to AnimatedAgent ...

  }, [token, devices.audio, isSpeaking, callId, onProcessed]);

  return (
    <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full z-10">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}
      <AnimatedLogo isSpeaking={isSpeaking} />
    </div>
  );
} 