import { NextRequest, NextResponse } from 'next/server';
import { createOnboardingAgent } from '@/services/agent';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
    const supabase = await createClient();

    try {
        // Retrieve the authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) {
            throw new Error(`Failed to retrieve user: ${userError.message}`);
        }

        if (!user) {
            return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
        }

        // Get user's given_name from users table
        const { data: userData, error: userDataError } = await supabase
            .from('users')
            .select('given_name')
            .eq('user_id', user.id)
            .single();

        if (userDataError) {
            console.error('Error fetching user data:', userDataError);
        }

        // Fetch the persona from the Supabase database
        const { data: personaData, error: personaError } = await supabase
            .from('user_personas')
            .select('introduction, uniqueness, audience, value_proposition, style, goals')
            .eq('user_id', user.id)
            .single();

        if (personaError) {
            throw new Error(`Failed to fetch persona: ${personaError.message}`);
        }

        if (!personaData) {
            return NextResponse.json({ error: 'No persona found for the user' }, { status: 404 });
        }

        // Use the persona data to create the onboarding agent
        await createOnboardingAgent({
            user_id: user.id,
            user_name: userData?.given_name || '',
            prompt_personalization: JSON.stringify(personaData),
        });

        return NextResponse.json({ message: 'Agent created successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error in create-agent API:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}