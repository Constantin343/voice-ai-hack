import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server'; // Adjust the import path as needed

interface RequestBody {
    tweetContent: string;
}

export async function POST(request: NextRequest) {
    let supabase;

    try {
        // Parse and type the request body
        const { tweetContent } = (await request.json()) as RequestBody;

        // Initialize Supabase client
        supabase = await createClient();

        // Step 1: Get the authenticated user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error('Authentication error:', authError);
            return NextResponse.json({ error: 'User not authenticated.' }, { status: 401 });
        }

        const userId = user.id;

        // Step 2: Retrieve Twitter access token
        const { data: tokenData, error: tokenError } = await supabase
            .from('user_auth')
            .select('twitter_access_token')
            .eq('user_id', userId)
            .single();

        if (tokenError || !tokenData?.twitter_access_token) {
            console.error('Error fetching Twitter token:', tokenError);
            // Redirect the user to re-authenticate with Twitter
            const redirectUrl = '/auth/twitter';
            return NextResponse.redirect(redirectUrl);
        }

        const twitterAccessToken = tokenData.twitter_access_token;

        console.log('Posting with Twitter access token:', twitterAccessToken);

        // Step 3: Attempt to post the tweet using fetch
        try {
            const body = JSON.stringify({ text: tweetContent });
            console.log('Posting tweet with body:', body);
            const response = await fetch('https://api.twitter.com/2/tweets', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${twitterAccessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: tweetContent }),
            });

            if (!response.ok) {
                const errorResponse = await response.json();
                console.error('Error posting tweet:', errorResponse);

                // Check if the error is due to an invalid or expired token
                if (response.status === 401 || errorResponse.errors?.[0]?.code === 89) {
                    console.log('Access token expired or invalid, redirecting to re-authenticate...');
                    const redirectUrl = '/auth/twitter';
                    return NextResponse.redirect(redirectUrl);
                }

                // Other errors
                return NextResponse.json(
                    { error: 'Failed to post tweet.', details: errorResponse },
                    { status: response.status }
                );
            }

            const tweetResponse = await response.json();
            console.log('Tweet posted successfully:', tweetResponse);
            return NextResponse.json({ success: true, data: tweetResponse });
        } catch (err) {
            console.error('Error posting tweet:', err);
            return NextResponse.json(
                { error: 'Failed to post tweet.', details: (err as Error).message },
                { status: 500 }
            );
        }
    } catch (err) {
        console.error('Unexpected error:', err);
        return NextResponse.json(
            { error: 'An unexpected error occurred.', details: (err as Error).message },
            { status: 500 }
        );
    }
}