export default function IntroVideoScreen({ onNext }: { onNext: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center h-full">
            <h1 className="text-3xl font-bold mb-8">Welcome to Our App</h1>
            <iframe
                src="https://player.vimeo.com/video/YOUR_VIDEO_ID"
                width="640"
                height="360"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="rounded-lg shadow-lg"
            ></iframe>
            <button
                onClick={onNext}
                className="mt-8 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
                Next
            </button>
        </div>
    );
}