'use client';
import { useState } from "react";

export default function PersonaCreationScreen({ onNext }: { onNext: () => void }) {
    const [question, setQuestion] = useState("What are your goals for using this app?");
    const [response, setResponse] = useState("");

    const handleVoiceInput = (input: string) => {
        setResponse(input);

        // Example logic for setting the next question or transitioning to the next step
        if (input.length > 10) {
            onNext(); // Proceed to the next screen when the response is meaningful
        } else {
            setQuestion("Can you elaborate a bit more?");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full">
            <h1 className="text-2xl font-semibold mb-6">{question}</h1>
            <div className="w-3/4 text-center">
                <p>We’re listening... Please answer the question using your voice.</p>
                <button
                    className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
                    onClick={() => handleVoiceInput("Sample voice response")}
                >
                    Simulate Voice Input
                </button>
            </div>
            <div className="mt-4">
                <p className="text-lg">Your response: {response}</p>
            </div>
        </div>
    );
}