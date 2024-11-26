import { NextRequest, NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';
import {createClient} from "@/utils/supabase/server"; // Replace with the actual path to your Supabase client function

export async function GET(request: NextRequest) {
    const supabase = await createClient()

    try {
        console.log('Starting GET handler for Twitter callback...');

        // Parse the incoming request URL to extract the 'code' parameter from query string
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        console.log('Authorization code:', code);

        if (!code) {
            console.warn('Missing authorization code in the request.');
            return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
        }

        // Retrieve the currently authenticated user
        console.log('Retrieving currently authenticated user...');
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            console.error('Failed to retrieve the authenticated user:', error);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = user.id;
        console.log('Authenticated user ID:', userId);

        // Fetch the code verifier from the database for the user
        console.log('Fetching code_verifier from the database...');
        const { data: userAuth, error: fetchError } = await supabase
            .from('user_auth')
            .select('twitter_verification_code')
            .eq('user_id', userId)
            .single();

        if (fetchError || !userAuth?.twitter_verification_code) {
            console.error('Failed to retrieve code_verifier from the database:', fetchError);
            return NextResponse.json({ error: 'Code verifier not found' }, { status: 400 });
        }

        const codeVerifier = userAuth.twitter_verification_code;
        console.log('Code verifier retrieved from database:', codeVerifier);

        // Validate required environment variables to ensure proper server configuration
        const clientId = process.env.TWITTER_CLIENT_ID;
        const clientSecret = process.env.TWITTER_CLIENT_SECRET;
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

        console.log('Environment variables:');
        console.log('TWITTER_CLIENT_ID:', clientId);
        console.log('TWITTER_CLIENT_SECRET:', clientSecret ? '*****' : 'undefined'); // Mask sensitive info
        console.log('NEXT_PUBLIC_BASE_URL:', baseUrl);

        if (!clientId || !clientSecret || !baseUrl) {
            console.error('Server configuration error: Missing one or more required environment variables.');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // Construct the redirect URI used during the initial authorization flow
        const redirectUri = `${baseUrl}/auth/twitter/callback`;
        console.log('Redirect URI:', redirectUri);

        // Initialize the Twitter API client with client credentials
        const client = new TwitterApi({ clientId, clientSecret });
        console.log('Initialized Twitter API client.');

        // Exchange the authorization code for access and refresh tokens
        console.log('Exchanging authorization code for tokens...');
        const { accessToken, refreshToken, expiresIn } = await client.loginWithOAuth2({
            code,
            codeVerifier,
            redirectUri,
        });
        console.log('Tokens received:');
        console.log('Access Token:', accessToken);
        console.log('Refresh Token:', refreshToken);
        console.log('Expires In:', expiresIn);

        // Store the tokens in the Supabase database
        console.log('Storing tokens in the database...');
        const { error: updateError } = await supabase
            .from('user_auth')
            .update({
                twitter_access_token: accessToken,
                created_at: new Date().toISOString(),
            })
            .eq('user_id', userId);

        if (updateError) {
            console.error('Error storing tokens in the database:', updateError);
            return NextResponse.json({ error: 'Failed to store tokens' }, { status: 500 });
        }

        console.log('Tokens successfully stored in the database.');

        // Redirect the user to the home page after successful authentication
        console.log('Redirecting to home page...');
        return NextResponse.redirect(new URL('/', request.url));
    } catch (error: any) {
        // Log the error details for debugging purposes
        console.error('Error during Twitter callback:', error);

        // Respond with a generic error message and detailed error information for debugging
        return NextResponse.json(
            { error: 'Authentication failed', details: error.message },
            { status: 500 }
        );
    }
}