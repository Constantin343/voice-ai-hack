'use client'

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Confetti from "react-confetti";

export default function SummaryScreen({ onNext }: { onNext: () => void }) {
    const supabase = createClient();
    const [userData, setUserData] = useState<any>(null);
    const [persona, setPersona] = useState<{
        introduction: string;
        uniqueness: string;
        audience: string;
        value_proposition: string;
        style: string;
        goals: string;
    } | null>(null);
    const [loading, setLoading] = useState(true);
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
                        {userData?.user_metadata?.name}, Congratulations on Creating Your Persona!
                    </h1>
                </header>

                {/* Success Message */}
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">You did it!</h2>
                    <p className="text-gray-600 mt-2">
                        Your persona is now complete and will guide your journey with our platform.
                        Don't worry, you can always make changes to your persona in the knowledge base area later.
                    </p>
                </div>

                {/* Persona Details */}
                <div className="space-y-16">
                    <PersonaField
                        title="Introduction"
                        value={persona.introduction}
                    />
                    <PersonaField
                        title="Uniqueness"
                        value={persona.uniqueness}
                    />
                    <PersonaField
                        title="Audience"
                        value={persona.audience}
                    />
                    <PersonaField
                        title="Value Proposition"
                        value={persona.value_proposition}
                    />
                    <PersonaField
                        title="Style"
                        value={persona.style}
                    />
                    <PersonaField
                        title="Goals"
                        value={persona.goals}
                    />
                </div>

                {/* Finish Onboarding Button */}
                <div className="mt-8">
                    <Button
                        onClick={onNext}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105"
                    >
                        Finish Onboarding
                    </Button>
                </div>
            </div>
        </div>
    );
}

function PersonaField({ title, value }: { title: string; value: string }) {
    return (
        <div className="space-y-4 bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            <p className="text-gray-600 whitespace-pre-line">{value || "N/A"}</p>
        </div>
    );
}