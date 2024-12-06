'use client'

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Confetti from "react-confetti";
import PersonaForm, { PersonaData } from "@/components/persona/PersonaForm"
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function SummaryScreen({ onNext }: { onNext: () => void }) {
    const supabase = createClient();
    const [userData, setUserData] = useState<any>(null);
    const [persona, setPersona] = useState<PersonaData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const updateWindowSize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };

        updateWindowSize();
        window.addEventListener("resize", updateWindowSize);
        return () => window.removeEventListener("resize", updateWindowSize);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setUserData(user);

                    const { data: persona } = await supabase
                        .from("user_personas")
                        .select()
                        .single();

                    if (persona) {
                        setPersona(persona);
                    }
                }
            } catch (error) {
                console.error("Error fetching persona:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [supabase]);

    const handleSubmit = async () => {
        if (!persona) return;
        
        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                throw new Error('Not authenticated');
            }

            // Update persona in database
            const { error: personaError } = await supabase
                .from('user_personas')
                .upsert({
                    user_id: user.id,
                    ...persona,
                    updated_at: new Date().toISOString()
                });

            if (personaError) throw personaError;

            // Update the LLM
            const response = await fetch('/api/agent/update-persona', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(persona)
            });

            if (!response.ok) {
                throw new Error('Failed to update agent persona');
            }

            onNext();
        } catch (error) {
            console.error('Error saving persona:', error);
            toast.error('Failed to save changes');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (field: keyof PersonaData, value: string) => {
        if (persona) {
            setPersona({ ...persona, [field]: value });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 relative">
                <Confetti width={windowSize.width} height={windowSize.height} />
                <p className="text-gray-500 text-lg">Celebrating your journey... Loading your persona!</p>
            </div>
        );
    }

    if (!persona) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-500 text-lg">No persona data found.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12 relative">
            <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={200} />
            <div className="max-w-3xl mx-auto space-y-16">
                {/* Header */}
                <header className="flex items-center gap-4 border-b border-gray-200 pb-6">
                    <div className="w-12 h-12">
                        {userData?.user_metadata?.picture ? (
                            <img
                                src={userData.user_metadata.picture}
                                alt="Profile"
                                className="w-full h-full rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-lg">
                                    {userData?.user_metadata?.name?.[0] || "?"}
                                </span>
                            </div>
                        )}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                        {userData?.user_metadata?.name}, Review Your Persona!
                    </h1>
                </header>

                {isSubmitting && (
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg flex items-center gap-4">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                            <p className="text-gray-800">Saving your persona...</p>
                        </div>
                    </div>
                )}

                <PersonaForm 
                    persona={persona}
                    onChange={handleChange}
                    onSubmit={handleSubmit}
                    submitLabel="Finish Onboarding"
                    isSubmitting={isSubmitting}
                    showSuccessMessage={true}
                />
            </div>
        </div>
    );
}