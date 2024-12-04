import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

export default function IntroVideoScreen({ onNext }: { onNext: () => void }) {
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);

    useEffect(() => {
        // Enable the button after 40 seconds
        const timer = setTimeout(() => {
            setIsButtonDisabled(false);
        }, 40000);

        // Cleanup the timer when the component unmounts
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <h1 className="text-3xl font-bold mb-4">welcome to publyc :)</h1>
            <div className="h-[70vh] aspect-[9/16]">
                <iframe
                    src="https://player.vimeo.com/video/1035417977"
                    width="100%"
                    height="100%"
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
                    allowFullScreen
                    className="rounded-lg shadow-lg"
                    style={{ border: 'none' }}
                ></iframe>
            </div>
            <button
                onClick={onNext}
                className={`mt-8 bg-[#2d12e9] hover:bg-[#2d12e9]/90 text-white px-4 py-2 rounded ${
                    isButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={isButtonDisabled}
            >
                Create Persona <ArrowRight className="ml-2 inline" />
            </button>
        </div>
    );
}