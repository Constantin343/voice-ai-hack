export default function SummaryScreen({ onNext }: { onNext: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center h-full">
            <h1 className="text-3xl font-bold mb-8">Your Persona</h1>
            <div className="bg-gray-100 p-8 rounded-lg shadow-lg">
                <p className="text-lg">Here is what we’ve crafted for you:</p>
                <p className="mt-4 text-xl font-medium">persona PLACEHOLDER</p>
            </div>
            <button
                onClick={onNext}
                className="mt-8 bg-green-500 text-white px-4 py-2 rounded"
            >
                Finish Onboarding
            </button>
        </div>
    );
}