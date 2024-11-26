import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server'; // Adjust the import path as needed
import { TwitterApi } from 'twitter-api-v2';

interface RequestBody {
    tweetContent: string;
}

async function regenerateTwitterToken(userId: string): Promise<string | null> {
    try {
        const response = await fetch('/auth/twitter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
            console.error('Failed to regenerate Twitter token:', await response.text());
            return null;
        }

        const { twitter_access_token } = await response.json();
        return twitter_access_token || null;
    } catch (err) {
        console.error('Error during token regeneration:', err);
        return null;
    }
}

export async function POST(request: NextRequest) {
    let supabase;
    try {
        // Parse and type the request body
        const { tweetContent } = (await request.json()) as RequestBody;

        // Initialize Supabase client
        supabase = await createClient();

        // Step 1: Get the authenticated user
        let user;
        try {
            const { data, error } = await supabase.auth.getUser();
            if (error || !data.user) throw new Error('User not authenticated.');
            user = data.user;
        } catch (err) {
            console.error('Authentication error:', err);
            return NextResponse.json({ error: 'User not authenticated.' }, { status: 401 });
        }

        const userId = user.id;

        // Step 2: Retrieve Twitter access token
        let twitterAccessToken;
        try {
            const { data, error } = await supabase
                .from('user_auth')
                .select('twitter_access_token')
                .eq('user_id', userId)
                .single();

            if (error || !data?.twitter_access_token) throw new Error('Twitter access token not found.');
            twitterAccessToken = data.twitter_access_token;
        } catch (err) {
            console.error('Error fetching Twitter token:', err);
            // Try regenerating the token
            twitterAccessToken = await regenerateTwitterToken(userId);
            if (!twitterAccessToken) {
                return NextResponse.json(
                    { error: 'Failed to retrieve or regenerate Twitter access token.' },
                    { status: 500 }
                );
            }
        }

        // Step 3: Post the tweet
        try {
            const twitterClient = new TwitterApi(twitterAccessToken);
            const tweetResponse = await twitterClient.v2.tweet(tweetContent);
            return NextResponse.json({ success: true, data: tweetResponse });
        } catch (err) {
            console.error('Error posting tweet:', err);
            // Retry by regenerating the token
            twitterAccessToken = await regenerateTwitterToken(userId);
            if (!twitterAccessToken) {
                return NextResponse.json(
                    { error: 'Failed to regenerate Twitter token after failed tweet attempt.' },
                    { status: 500 }
                );
            }

            try {
                const twitterClient = new TwitterApi(twitterAccessToken);
                const tweetResponse = await twitterClient.v2.tweet(tweetContent);
                return NextResponse.json({ success: true, data: tweetResponse });
            } catch (finalErr) {
                console.error('Retry failed for posting tweet:', finalErr);
                return NextResponse.json(
                    { error: 'Failed to post tweet after retry.', details: (finalErr as Error).message },
                    { status: 500 }
                );
            }
        }
    } catch (err) {
        console.error('Unexpected error:', err);
        return NextResponse.json(
            { error: 'An unexpected error occurred.', details: (err as Error).message },
            { status: 500 }
        );
    }
}