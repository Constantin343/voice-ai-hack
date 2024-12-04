'use client'

import { useState, useEffect, Suspense } from "react";
import { useAgent } from "@/contexts/AgentContext";
import { createClient } from "@/utils/supabase/client";
import InfoIcon from "@/components/infobar";
import { AnimatedAgent } from "@/components/AnimatedAgent";
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

function SubscriptionStatus() {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Handle subscription status messages
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    console.log('Search params:', { success, canceled }); // Debug log
    
    if (success === 'true') {
      console.log('Showing success toast'); // Debug log
      toast.success('Successfully upgraded to premium!');
    }
    
    if (canceled === 'true') {
      console.log('Showing error toast'); // Debug log
      toast('Subscription upgrade canceled.', {
        description: "You can try again anytime.",
        duration: 5000,
      });
    }
  }, [searchParams]);
  
  return null;
}

export default function Home() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { agentId, setAgentId } = useAgent();

  useEffect(() => {
    const fetchAgentId = async () => {
      if (!agentId) {
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from('user_agent')
          .select('agent_id')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          console.error('Error fetching agent:', error);
          return;
        }
        console.log('Agent data:', data);

        if (data?.agent_id) {
          setAgentId(data.agent_id);
        }
      }
    };

    fetchAgentId();
  }, [agentId, setAgentId]);

  return (
    <div className="fixed inset-0 bg-white dark:bg-black text-black dark:text-[#FFFBF0]">
      <Suspense fallback={null}>
        <SubscriptionStatus />
      </Suspense>
      <div className="h-full flex flex-col items-center justify-between p-8 pb-20">
        <div className="flex-1 flex items-center justify-center w-full">
          <div 
            className="flex items-center justify-center cursor-pointer"
            onClick={() => setIsSpeaking(!isSpeaking)}
          >
            <AnimatedAgent isSpeaking={isSpeaking} />
          </div>
        </div>
        <InfoIcon />
      </div>
    </div>
  );
}
