'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { RetellWebClient } from "retell-client-js-sdk";
import { useRouter } from 'next/navigation'
import { Loader2 } from "lucide-react"
import { useAgent } from '@/contexts/AgentContext'
import AnimatedLogo from './AnimatedLogo'
import { UpgradeDialog } from './UpgradeDialog'
import { FreeTrialWarningDialog } from './FreeTrialWarningDialog'

interface AnimatedAgentProps {
  isSpeaking: boolean
}

export const AnimatedAgent: React.FC<AnimatedAgentProps> = ({ isSpeaking }) => {
  const router = useRouter();
  const { agentId } = useAgent();
  const retellClientRef = useRef<RetellWebClient | null>(null);
  const [rotation, setRotation] = useState(0);
  const [devices, setDevices] = useState<{ audio: MediaDeviceInfo[] }>({ audio: [] });
  const [token, setToken] = useState('');
  const [callId, setCallId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [remainingPosts, setRemainingPosts] = useState(10);
  const [hasSeenWarning, setHasSeenWarning] = useState(false);

  // Get available audio devices
  useEffect(() => {
    async function getAudioDevices() {
      try {
        // Add explicit constraints for mobile
        const constraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Ensure we stop the stream after getting permission
        stream.getTracks().forEach(track => track.stop());
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioDevices = devices.filter(device => device.kind === 'audioinput');
        
        if (audioDevices.length === 0) {
          throw new Error('No audio input devices found');
        }
        
        setDevices({ audio: audioDevices });
      } catch (error) {
        console.error("Error accessing audio devices:", error);
        // Add user-friendly error handling here if needed
      }
    }

    getAudioDevices();
  }, []);

  // Update the token fetch useEffect
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch('/api/agent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ agent_id: agentId }),
          credentials: 'include',
        });
        
        const data = await response.json();
        
        if (response.status === 403) {
          if (data.error?.includes('Free tier limit reached')) {
            setShowUpgradeDialog(true);
            return null; // Return null to prevent call setup
          }
          if (data.warning?.includes('Free tier limit approaching') && !hasSeenWarning) {
            setRemainingPosts(data.remainingPosts);
            setShowWarningDialog(true);
            setToken(''); // Don't set the token yet
            return null; // Return null to prevent call setup
          }
        }
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        if (!data.accessToken) {
          throw new Error('No access token received');
        }
        
        console.log('token received');
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
  }, [isSpeaking, agentId, hasSeenWarning]);

  // Add handler for warning dialog close
  const handleWarningClose = async () => {
    setShowWarningDialog(false);
    setHasSeenWarning(true);
    
    // If the user closes the warning, start the call
    if (isSpeaking) {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agent_id: agentId }),
        credentials: 'include',
      });
      
      const data = await response.json();
      if (data.accessToken) {
        setToken(data.accessToken);
        if (data.callId) {
          setCallId(data.callId);
        }
      }
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const setupRetellCall = async () => {
      try {
        if (!token) {
          throw new Error('No access token available');
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
        // Reset the speaking state or show error to user
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
          const response = await fetch('/api/agent/post', {
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
          
          try {
            router.push(`/post/${data.data.id}`);
          } catch (error) {
            console.error('Error navigating:', error);
            // Fallback navigation attempt
            window.location.href = `/post/${data.data.id}`;
          } finally {
            setIsProcessing(false);
            setCallId('');
          }

        } catch (error) {
          console.error('Error sending post request:', error);
          setIsProcessing(false);
          setCallId('');
        }
      }
    };

    if (isSpeaking && devices.audio.length > 0) {
      console.log('🎤 isSpeaking activated, initiating call...');
      setupRetellCall();
      
      interval = setInterval(() => {
        setRotation((prev) => (prev + 10) % 360);
      }, 100);
    } else if (!isSpeaking && retellClientRef.current) {
      cleanupCall();
    }

    return () => {
      if (interval) clearInterval(interval);
      if (retellClientRef.current && !isSpeaking) {
        console.log('🧹 Cleanup: Stopping Retell call');
        retellClientRef.current.stopCall();
        retellClientRef.current = null;
      }
    };
  }, [token, devices.audio, isSpeaking, callId, router]);

  return (
    <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full z-10">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}
      <AnimatedLogo isSpeaking={isSpeaking} />
      <UpgradeDialog 
        isOpen={showUpgradeDialog} 
        onClose={() => setShowUpgradeDialog(false)} 
      />
      <FreeTrialWarningDialog 
        isOpen={showWarningDialog}
        onClose={handleWarningClose}
        remainingPosts={remainingPosts}
      />
    </div>
  )
}

