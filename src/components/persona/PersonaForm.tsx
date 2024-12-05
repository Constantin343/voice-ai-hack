'use client'

import React from 'react';
import { Button } from "@/components/ui/button";

export interface PersonaData {
    introduction: string;
    uniqueness: string;
    audience: string;
    value_proposition: string;
    style: string;
    goals: string;
}

export interface PersonaFormProps {
    persona: PersonaData;
    onChange: (field: keyof PersonaData, value: string) => void;
    onSubmit: () => void;
    submitLabel?: string;
    isSubmitting?: boolean;
    readOnly?: boolean;
    showSuccessMessage?: boolean;
}

export function PersonaField({ 
    title, 
    subtitle,
    value,
    placeholder,
    onChange,
    readOnly = false,
}: { 
    title: string;
    subtitle?: string;
    value: string;
    placeholder?: string;
    onChange?: (value: string) => void;
    readOnly?: boolean;
}) {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    };

    return (
        <div className="space-y-4 bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="space-y-2">
                <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                {subtitle && (
                    <p className="text-sm text-gray-600 whitespace-pre-line">{subtitle}</p>
                )}
            </div>
            {readOnly ? (
                <p className="text-gray-600 whitespace-pre-line">{value || "N/A"}</p>
            ) : (
                <textarea 
                    ref={textareaRef}
                    className="w-full min-h-[120px] bg-white border border-gray-200 rounded-md 
                             text-gray-800 focus:border-blue-500 focus:ring-blue-500 
                             placeholder:text-gray-500 p-4 resize-none overflow-y-auto" 
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => {
                        onChange?.(e.target.value);
                        adjustHeight();
                    }}
                    rows={10}
                    readOnly={readOnly}
                />
            )}
        </div>
    );
}

export default function PersonaForm({ 
    persona, 
    onChange, 
    onSubmit, 
    submitLabel = "Save Changes",
    isSubmitting = false,
    readOnly = false,
    showSuccessMessage = false
}: PersonaFormProps) {
    return (
        <div className="space-y-8">
            {showSuccessMessage && (
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">You did it!</h2>
                    <p className="text-gray-600 mt-2">
                        Your persona is now complete and will guide your journey with our platform.
                        Don't worry, you can always make changes to your persona in the knowledge base area later.
                    </p>
                </div>
            )}

            <div className="space-y-8">
                <PersonaField
                    title="Introduction"
                    subtitle="What do you do? What are you passionate about?"
                    value={persona.introduction}
                    onChange={(value) => onChange('introduction', value)}
                    readOnly={readOnly}
                />

                <PersonaField
                    title="Uniqueness"
                    subtitle="How do you want to be perceived by others? What are the things that make you unique?"
                    value={persona.uniqueness}
                    onChange={(value) => onChange('uniqueness', value)}
                    readOnly={readOnly}
                />

                <PersonaField
                    title="Audience"
                    subtitle="Who are you targeting with your personal brand? Your personal brand is not about you - it's about the people you want to serve with the skills, knowledge, and value you can provide."
                    value={persona.audience}
                    onChange={(value) => onChange('audience', value)}
                    readOnly={readOnly}
                />

                <PersonaField
                    title="Value Proposition"
                    subtitle="How do you solve those problems? What exactly is the value you provide?"
                    value={persona.value_proposition}
                    onChange={(value) => onChange('value_proposition', value)}
                    readOnly={readOnly}
                />

                <PersonaField
                    title="Style"
                    subtitle="What creators do you admire? What style do you aspire? (verbally, visually, etc.)"
                    value={persona.style}
                    onChange={(value) => onChange('style', value)}
                    readOnly={readOnly}
                />

                <PersonaField
                    title="Goals"
                    subtitle="How do you measure your content's success? Where do you want to be in one year with your brand? What's your business model? What's your vision?"
                    value={persona.goals}
                    onChange={(value) => onChange('goals', value)}
                    readOnly={readOnly}
                />
            </div>

            {!readOnly && (
                <div className="pt-8">
                    <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-semibold 
                                 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={onSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Saving...' : submitLabel}
                    </Button>
                </div>
            )}
        </div>
    );
} 