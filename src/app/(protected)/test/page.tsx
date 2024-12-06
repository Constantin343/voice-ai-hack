'use client'

import IntroVideoScreen from '@/components/onboarding/intro-video-screen'

export default function TestPage() {
  const handleNext = () => {
    console.log('Next clicked')
  }

  return (
    <div className="min-h-screen">
      <IntroVideoScreen onNext={handleNext} />
    </div>
  )
}
