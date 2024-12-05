'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { ArrowRight, Brain, Zap, Fingerprint, Mic, BarChart3 } from 'lucide-react'
import Script from 'next/script'
import { createClient } from '@/utils/supabase/client'
import {redirect, useRouter} from 'next/navigation'

export default function LandingPage() {
  const textRef = useRef<HTMLParagraphElement>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
    }
    
    checkAuth()
  }, [])

  useEffect(() => {
    if (isLoggedIn) {
      //redirect('/home');
    }
  }, [isLoggedIn])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsLoggedIn(false)
    router.refresh()
  }

  const handleGetStarted = () => {
    if (isLoggedIn) {
      router.push('/home')
    } else {
      router.push('/login')
    }
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100')
          entry.target.classList.remove('opacity-0', 'translate-y-4')
        }
      },
      {
        threshold: 0.1,
      }
    )

    if (textRef.current) {
      observer.observe(textRef.current)
    }

    return () => {
      if (textRef.current) {
        observer.unobserve(textRef.current)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      {/* Navigation - Updated */}
      <nav className="container mx-auto px-6 sm:px-8 md:px-12 py-6 flex justify-between items-center">
        <div className="text-2xl font-bold">publyc</div>
        {isLoggedIn ? (
          <Button variant="outline" onClick={handleLogout}>log out</Button>
        ) : (
          <Link href="/login">
            <Button variant="outline">log in</Button>
          </Link>
        )}
      </nav>

      {/* Logo */}
      <div className="container mx-auto py-8 flex justify-center">
        <Image 
          src="/images/publyc%20logo%20black.svg" 
          alt="publyc logo" 
          width={200} 
          height={80} 
          priority 
        />
      </div>

      {/* Hero Section */}
      <section className="container mx-auto py-20 text-center">
        <div className="max-w-[1800px] mx-auto">
          <h1 className="text-5xl font-bold mb-4 lowercase px-4 md:px-8">distribution that works while you build</h1>
          <p className="text-xl mb-8 max-w-[1600px] mx-auto px-4 md:px-8">
            publyc helps you to build your personal brand and grow an audience as a founder.
            <br />
            Capture your thoughts anywhere, go viral everywhere - in minutes.
          </p>
          <Button 
            size="lg" 
            className="bg-[#2d12e9] hover:bg-[#2d12e9]/90"
            onClick={handleGetStarted}
          >
            JOIN WAITLIST <ArrowRight className="ml-2" />
          </Button>
        </div>
      </section>

      {/* Trust + Attention Section */}
      <section className="bg-[#2d12e9] text-white py-32 md:py-48 relative">
        <div className="container mx-auto text-center flex flex-col justify-center min-h-[400px] px-6 sm:px-8 md:px-12">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold lowercase">
            trust + attention<br />is the new moat*
          </h2>
          <p 
            ref={textRef}
            className="text-xl md:text-2xl transition-all duration-1000 transform opacity-0 translate-y-4 absolute bottom-12 left-1/2 -translate-x-1/2 w-full px-6 sm:px-8 md:px-12"
          >
            *and personal branding is the best way to achieve that.
          </p>
        </div>
      </section>

      {/* Solution Pillars */}
      <section className="py-20">
        <div className="container mx-auto text-center px-6 sm:px-8 md:px-12">
          <h2 className="text-4xl font-bold mb-12 lowercase">create unique content to grow your business</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="px-4">
              <Brain size={48} className="mx-auto mb-4 text-[#2d12e9]" />
              <h3 className="text-xl font-semibold mb-4 lowercase">we help you get started</h3>
              <p>In-depth onboarding to gain brand clarity and create your content strategy.</p>
            </div>
            <div className="px-4">
              <Zap size={48} className="mx-auto mb-4 text-[#2d12e9]" />
              <h3 className="text-xl font-semibold mb-4 lowercase">we remove all friction</h3>
              <p>Turn spontaneous thoughts into viral posts. Your second brain does the heavy lifting.</p>
            </div>
            <div className="px-4">
              <Fingerprint size={48} className="mx-auto mb-4 text-[#2d12e9]" />
              <h3 className="text-xl font-semibold mb-4 lowercase">we amplify your depth</h3>
              <p>We learn from your patterns & insights. AI replicates your uniqueness at scale.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-gray-100 py-20">
        <div className="container mx-auto text-center px-6 sm:px-12 md:px-10">
          <h2 className="text-4xl font-bold mb-12 lowercase">join forward-thinking builders</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow flex items-center">
              <Image src="/placeholder.svg?height=64&width=64" alt="Jane Doe" width={64} height={64} className="rounded-full mr-4" />
              <div>
                <p className="mb-2">"publyc turned my random thoughts into successful posts. What used to take hours now happens automatically while I build my startup."</p>
                <p className="font-semibold">- Marvin Smith, Tech Entrepreneur</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow flex items-center">
              <Image src="/placeholder.svg?height=64&width=64" alt="John Smith" width={64} height={64} className="rounded-full mr-4" />
              <div>
                <p className="mb-2">"publyc keeps my authentic voice while scaling my presence. It's like having a content team that lives in my brain."</p>
                <p className="font-semibold">- Lukas Meischer, VC Investor</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 md:py-20 lg:py-24">
        <div className="container mx-auto text-center px-4">
          <h2 className="text-4xl font-bold lowercase mb-8 md:mb-12">creation at the speed of thought</h2>
          
          <p className="text-xl max-w-3xl mx-auto mb-12">
            publyc turns your daily insights into engaging LinkedIn & Twitter content that grows your audience organically. Using fine-tuned AI, proven frameworks from top creators, and a second brain that knows you and your goals, we help you build trust and influence while maintaining your unique voice.
          </p>

          <div className="w-full max-w-[800px] mx-auto bg-white rounded-lg shadow-lg">
            <div className="relative pb-[56.25%] h-0">
              <iframe
                src="https://player.vimeo.com/video/775497353?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479"
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
                title="CupMate // Pitch Video"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing
      <section className="bg-gray-100 py-20">
        <div className="container mx-auto text-center px-6 sm:px-8 md:px-12">
          <h2 className="text-4xl font-bold mb-12 lowercase">start free, upgrade later</h2>
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm mx-auto">
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-4 lowercase">try it for free</h3>
              <p className="mb-6">Start with our free plan and upgrade when you're ready.</p>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-black mr-2">✓</span> full access to all features
                </li>
                <li className="flex items-center">
                  <span className="text-black mr-2">✓</span> limited generations
                </li>
                <li className="flex items-center">
                  <span className="text-black mr-2">✓</span> no payment required
                </li>
              </ul>
              
              <div className="border-t pt-8">
                <h3 className="text-2xl font-bold mb-2 lowercase">after your trial</h3>
                <div className="mb-6">
                  <p className="text-4xl font-bold">€5<span className="text-lg">/month</span> <span className="text-lg line-through text-gray-400">€20</span></p>
                  <p className="text-sm text-gray-600">early beta phase pricing - limited time</p>
                </div>
                <ul className="text-left space-y-2 mb-8">
                  <li className="flex items-center">
                    <span className="text-[#2d12e9] mr-2">✓</span> unlimited generations
                  </li>
                  <li className="flex items-center">
                    <span className="text-[#2d12e9] mr-2">✓</span> priority support
                  </li>
                  <li className="flex items-center">
                    <span className="text-[#2d12e9] mr-2">✓</span> be the first to get new features
                  </li>
                </ul>
              </div>
            </div>
            
            <Button 
              size="lg" 
              className="w-full bg-[#2d12e9] hover:bg-[#2d12e9]/90"
              onClick={handleGetStarted}
            >
              get started for free
            </Button>
          </div>
        </div>
      </section>
      */}

      {/* Founders Section */}
      <section className="py-20 bg-black text-white">
        <div className="container mx-auto text-center px-6 sm:px-8 md:px-12">
          <h2 className="text-4xl font-bold mb-8 lowercase">from founders for founders</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <Image 
              src="/images/publycfounders.jpg" 
              alt="The publyc founding team at an AI Hackathon" 
              width={300} 
              height={300} 
              className="rounded-lg object-cover"
            />
            <div className="max-w-md text-left px-4 md:px-0">
              <h3 className="text-2xl font-semibold mb-4 lowercase">we are building publyc in public</h3>
              <p className="mb-4">
                As founders ourselves, we understand the challenges of building a personal brand while focusing on product development. That's why we created publyc - to solve our own problem and help other founders like us.
              </p>
              <p>
                We're using publyc to build in public, experiencing firsthand the power of turning our insights into engaging content. Join us on this journey of growth and innovation.
              </p>
              <br />
              <p>
                <Link href="https://www.linkedin.com/in/constantin-weberpals/" className="hover:text-[#2d12e9] underline" target="_blank" rel="noopener noreferrer">Tino</Link>,{' '}
                <Link href="https://www.linkedin.com/in/sergiusoima/" className="hover:text-[#2d12e9] underline" target="_blank" rel="noopener noreferrer">Sergiu</Link>, and{' '}
                <Link href="https://www.linkedin.com/in/leon-sandner/" className="hover:text-[#2d12e9] underline" target="_blank" rel="noopener noreferrer">Leon</Link>
              </p>
            </div>
          </div>
        </div>

        {/* Logo Grid */}
        <div className="container mx-auto mt-16 px-6 sm:px-8 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 items-center justify-items-center max-w-3xl mx-auto">
            <Image
              src="/images/logos/cdtm.svg"
              alt="CDTM"
              width={150} 
              height={75}
              className="w-40 h-20 object-contain filter brightness-0 invert"
            />
            <Image
              src="/images/logos/stanford.svg"
              alt="Stanford"
              width={150}
              height={75} 
              className="w-40 h-20 object-contain filter brightness-0 invert"
            />
            <Image
              src="/images/logos/eth.svg"
              alt="ETH"
              width={150}
              height={75}
              className="w-40 h-20 object-contain filter brightness-0 invert"
            />
            <Image
              src="/images/logos/cambridge.svg"
              alt="Cambridge"
              width={150}
              height={75}
              className="w-40 h-20 object-contain filter brightness-0 invert"
            />
            <Image
              src="/images/logos/tum.svg"
              alt="TUM"
              width={150}
              height={75}
              className="w-40 h-20 object-contain filter brightness-0 invert"
            />
            <Image
              src="/images/logos/tumai.svg"
              alt="TUM.ai"
              width={150}
              height={75}
              className="w-40 h-20 object-contain filter brightness-0 invert"
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8 lowercase">stop building in silence</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Let your ideas reach the audience they deserve.
            <br />
            Start growing your influence today.
          </p>
          <Button
            size="lg"
            className="bg-[#2d12e9] hover:bg-[#2d12e9]/90"
            onClick={handleGetStarted}
          >
            JOIN WAITLIST NOW <ArrowRight className="ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link href="https://www.linkedin.com/company/publyc-app/" className="mr-4 hover:text-[#2d12e9]" target="_blank" rel="noopener noreferrer">linkedin</Link>
            <Link href="https://x.com/publyc_app" className="hover:text-[#2d12e9]" target="_blank" rel="noopener noreferrer">twitter</Link>
          </div>
          <div>
            <Link href="mailto:publyc@mail.com" className="mr-4 hover:text-[#2d12e9]">contact</Link>
            <Link href="/terms.html" className="mr-4 hover:text-[#2d12e9]" target="_blank" rel="noopener noreferrer">terms of service</Link>
            <Link href="/privacy.html" className="hover:text-[#2d12e9]" target="_blank" rel="noopener noreferrer">privacy policy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
