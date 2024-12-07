'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2, Mail, Calendar } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchSubscription() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: subscriptionData } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setSubscription(subscriptionData);
      setLoading(false);
    }

    fetchSubscription();
  }, []);

  const handleSubscribe = async () => {
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-8 text-center sm:text-left">Settings</h1>

      <Card className="mb-8 mx-2 sm:mx-0">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">subscription</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Manage your subscription status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscription?.is_subscribed ? (
            <>
              <div className="mb-4">
                <p className="text-sm sm:text-base text-muted-foreground mb-1">Status</p>
                <p className="font-medium capitalize text-sm sm:text-base">{subscription.subscription_status}</p>
              </div>
              <Button className="w-full sm:w-auto" onClick={handleManageSubscription}>
                Manage Subscription
              </Button>
            </>
          ) : (
            <>
              <p className="mb-4 text-sm sm:text-base">You are currently on the free plan.</p>
              <Button className="w-full sm:w-auto" onClick={handleSubscribe}>
                Upgrade to Premium
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="mx-2 sm:mx-0 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">contact us</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Your feedback is highly appreciated!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-black" />
            <a 
              href="mailto:hello@publyc.app" 
              className="text-sm sm:text-base hover:underline text-black"
              target="_blank"
              rel="noopener noreferrer"
            >
              hello@publyc.app
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-black" />
            <a 
              href="https://booking.akiflow.com/publyc" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm sm:text-base hover:underline text-black"
            >
              Schedule a call with us
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 