import { NextRequest, NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';

export async function GET(request: NextRequest) {
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

        // Set the codeVerifier in a secure HTTP-only cookie
        console.log('Setting cookies for code_verifier...');
        const response = NextResponse.redirect(url);
        response.cookies.set('code_verifier', codeVerifier, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'none',
            path: '/',
        });

        console.log('Redirecting to Twitter auth URL...');
        return response;
    } catch (error) {
        console.error('Error generating Twitter auth URL:', error);
        return new NextResponse('Failed to generate Twitter auth URL', { status: 500 });
    }
}