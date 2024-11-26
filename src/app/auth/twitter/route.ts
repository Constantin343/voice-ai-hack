import { NextRequest, NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';
import {createClient} from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
    const supabase = await createClient()

    try {
        console.log('Starting GET handler for Twitter auth...');

        // Validate environment variables
        const clientId = process.env.TWITTER_CLIENT_ID as string;
        const clientSecret = process.env.TWITTER_CLIENT_SECRET as string;
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL as string;

        console.log('Environment variables:');
        console.log('TWITTER_CLIENT_ID:', clientId);
        console.log('TWITTER_CLIENT_SECRET:', clientSecret ? '*****' : 'undefined'); // Mask sensitive info
        console.log('NEXT_PUBLIC_BASE_URL:', baseUrl);

        if (!clientId || !clientSecret || !baseUrl) {
            console.error('Missing one or more required environment variables.');
            return new NextResponse('Missing environment variables', { status: 500 });
        }

        // Get user
        console.log('Getting user from Supabase...');
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            console.error('Failed to get user:', error);
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const user_id = user.id;
        console.log('Authenticated user ID:', user_id);

        // Initialize Twitter API client
        console.log('Initializing Twitter API client...');
        const client = new TwitterApi({ clientId, clientSecret });
        const TWITTER_REDIRECT_URI = `${baseUrl}/auth/twitter/callback`;
        console.log('Twitter redirect URI:', TWITTER_REDIRECT_URI);

        // Generate the OAuth2 authorization link
        console.log('Generating OAuth2 authorization link...');
        const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
            TWITTER_REDIRECT_URI,
            { scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'] }
        );

        console.log('Generated OAuth2 authorization link:');
        console.log('URL:', url);
        console.log('Code Verifier:', codeVerifier);
        console.log('State:', state);

        // Store codeVerifier in Supabase user_auth table
        console.log('Storing code_verifier in Supabase user_auth table...');
        const { data, error: upsertError } = await supabase.from('user_auth').upsert({
            user_id: user_id,
            twitter_verification_code: codeVerifier,
            created_at: new Date().toISOString(),
        }, {
            onConflict: 'user_id',
        });

        if (upsertError) {
            console.error('Error storing code_verifier in Supabase:', upsertError);
            return new NextResponse('Failed to store code_verifier', { status: 500 });
        }

        console.log('Successfully stored code_verifier in Supabase.');

        console.log('Redirecting to Twitter auth URL...');
        return NextResponse.redirect(url);

    } catch (error) {
        console.error('Error generating Twitter auth URL:', error);
        return new NextResponse('Failed to generate Twitter auth URL', { status: 500 });
    }
}