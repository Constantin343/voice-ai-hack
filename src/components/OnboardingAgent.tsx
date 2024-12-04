'use client'

import React, { useState, useEffect, useRef } from 'react'
import { RetellWebClient } from "retell-client-js-sdk";
import { Loader2 } from "lucide-react"
import AnimatedLogo from './AnimatedLogo'
import { toast } from 'sonner'

interface OnboardingAgentProps {
  isSpeaking: boolean;
  onTranscriptReceived: (transcript: string) => void;
}

export const OnboardingAgent: React.FC<OnboardingAgentProps> = ({ 
  isSpeaking,
  onTranscriptReceived 
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
          body: JSON.stringify({ isOnboarding: true }),
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
      // ... Same call setup code as AnimatedAgent ...
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

          const data = await response.json();
          onTranscriptReceived(data.data.transcript);

        } catch (error) {
          console.error('Error processing persona:', error);
          toast.error('Failed to process response');
        } finally {
          setIsProcessing(false);
          setCallId('');
        }
      }
    };

    // ... Rest of the effect code similar to AnimatedAgent ...

  }, [token, devices.audio, isSpeaking, callId, onTranscriptReceived]);

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