'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

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
    <div className="container max-w-2xl py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>
            Manage your subscription status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscription?.is_subscribed ? (
            <>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <p className="font-medium capitalize">{subscription.subscription_status}</p>
              </div>
              <Button onClick={handleManageSubscription}>
                Manage Subscription
              </Button>
            </>
          ) : (
            <>
              <p className="mb-4">You are currently on the free plan.</p>
              <Button onClick={handleSubscribe}>
                Upgrade to Premium
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 