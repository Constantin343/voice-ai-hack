import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import {User} from "@supabase/auth-js";

export default function SummaryScreen({ onNext }: { onNext: () => void }) {
    const supabase = createClient();
    const [user, setUser] = useState<User | null>(null);
    const [persona, setPersona] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch user and persona data
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user);

                if (user) {
                    const { data: persona } = await supabase
                        .from("user_personas")
                        .select("*")
                        .filter("user_id", "eq", user.id)
                        .single();
                    setPersona(persona);
                }
            } catch (error) {
                console.error("Error fetching persona:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-screen px-4 bg-gradient-to-br from-blue-50 to-white">
            {/* Logo Section */}
            <div className="flex flex-col items-center mb-24">
                <div className="flex items-center gap-4">
                    <svg
                        width="128"
                        height="128"
                        viewBox="0 0 1200 1200"
                        fill="black"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M646.5,162.5C773.278,157.843 880.444,200.843 968,291.5C1041.05,375.71 1073.05,473.71 1064,585.5C1058.36,642.076 1038.36,692.743 1004,737.5C955.628,794.176 895.128,813.343 822.5,795C794.495,787.332 766.495,779.666 738.5,772C673.007,758.494 627.173,782.327 601,843.5C591.844,869.079 588.511,895.412 591,922.5C593.386,942.203 596.053,961.869 599,981.5C600.466,994.469 600.799,1007.47 600,1020.5C594.162,1053.85 574.328,1069.01 540.5,1066C524.12,1063.88 509.12,1058.21 495.5,1049C475.549,1035.06 457.382,1018.89 441,1000.5C385,935.167 329,869.833 273,804.5C246.069,773.966 222.069,741.299 201,706.5C145.576,608.242 139.909,507.242 184,403.5C220.058,330.776 274.224,275.942 346.5,239C425.156,200.25 508.156,176.25 595.5,167C612.625,165.159 629.625,163.659 646.5,162.5Z" />
                    </svg>
                </div>
            </div>

            {/* Persona Summary Section */}
            <div className="text-center w-full max-w-md p-6 bg-white shadow-lg rounded-xl border border-gray-200">
                {loading ? (
                    <p className="text-gray-500">Loading your persona...</p>
                ) : persona ? (
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-xl font-semibold">Introduction</h2>
                            <p className="text-gray-700">{persona.introduction || "N/A"}</p>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">Uniqueness</h2>
                            <p className="text-gray-700">{persona.uniqueness || "N/A"}</p>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">Audience</h2>
                            <p className="text-gray-700">{persona.audience || "N/A"}</p>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">Value Proposition</h2>
                            <p className="text-gray-700">{persona.value_proposition || "N/A"}</p>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">Style</h2>
                            <p className="text-gray-700">{persona.style || "N/A"}</p>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">Goals</h2>
                            <p className="text-gray-700">{persona.goals || "N/A"}</p>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-500">No persona data found.</p>
                )}

                {/* Button */}
                <button
                    onClick={onNext}
                    className="mt-8 bg-[#2d12e9] text-white px-4 py-2 rounded hover:bg-[#2d12e9]/90"
                >
                    Finish Onboarding
                </button>
            </div>
        </div>
    );
}