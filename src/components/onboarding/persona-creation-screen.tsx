'use client';
import { useState } from "react";
import { OnboardingAgent } from "../OnboardingAgent";

export default function PersonaCreationScreen({ onNext }: { onNext: () => void }) {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [response, setResponse] = useState("");

    const handleTranscriptReceived = (transcript: string) => {
        setResponse(transcript);
        setIsSpeaking(false);

        if (transcript.toLowerCase().includes("finish") || 
            transcript.toLowerCase().includes("done")) {
            onNext();
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto px-4">
            <h2 className="text-2xl font-semibold mb-6">Let's Get to Know You</h2>
            
            {!isSpeaking && (
                <div className="w-full text-center mb-8">
                    <p className="text-muted-foreground">
                        Our AI assistant will ask you a few questions to understand your needs better.
                        Click the icon below to start the conversation.
                    </p>
                </div>
            )}

            <div 
                onClick={() => setIsSpeaking(!isSpeaking)}
                className="cursor-pointer"
            >
                <OnboardingAgent 
                    isSpeaking={isSpeaking}
                    onTranscriptReceived={handleTranscriptReceived}
                />
            </div>

            {response && (
                <div className="mt-6 w-full">
                    <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Last response:</p>
                        <p className="text-base mt-1">{response}</p>
                    </div>
                </div>
            )}
        </div>
    );
}