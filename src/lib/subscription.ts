import { SupabaseClient } from '@supabase/supabase-js';

export const FREE_TIER_LIMIT = 10;

export async function checkUserSubscription(supabase: SupabaseClient, userId: string) {
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  const postCount = subscription?.post_count || 0;
  const isSubscribed = subscription?.is_subscribed || false;
  const canCreatePost = isSubscribed || postCount < FREE_TIER_LIMIT;

  return {
    postCount,
    isSubscribed,
    canCreatePost,
    remainingPosts: isSubscribed ? -1 : FREE_TIER_LIMIT - postCount
  };
}

export async function incrementPostCount(supabase: SupabaseClient, userId: string) {
  const { isSubscribed } = await checkUserSubscription(supabase, userId);
  
  if (!isSubscribed) {
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('post_count')
      .eq('user_id', userId)
      .single();

    return supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        post_count: (subscription?.post_count || 0) + 1
      }, {
        onConflict: 'user_id'
      });
  }
} 