import { NextRequest, NextResponse } from 'next/server';
import { extractPersonaFromScrapedLinkedinProfile } from '@/lib/anthropic';
import {createClient} from "@/utils/supabase/server";

export const maxDuration = 60;
export async function POST(req: NextRequest) {
    const supabase = await createClient();

    try {
        const {
            data: {user},
            error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
            throw new Error(`Failed to retrieve user: ${userError.message}`);
        }

        if (!user) {
            return NextResponse.json({error: 'User not authenticated'}, {status: 401});
        }

        // Fetch profileData and postData from Supabase
        const { data: userPersonaData, error: fetchError } = await supabase
            .from('user_personas')
            .select('scraped_profile, scraped_posts')
            .eq('user_id', user.id)
            .single();

        if (fetchError) {
            throw new Error(`Failed to fetch data from Supabase: ${fetchError.message}`);
        }

        const { scraped_profile: profileData, scraped_posts: postData } = userPersonaData;

        if (!profileData || !postData) {
            return NextResponse.json({ error: 'Profile and Post data are required in Supabase' }, { status: 400 });
        }

        // Generate persona using Anthropic's API
        const persona = await extractPersonaFromScrapedLinkedinProfile(
            JSON.stringify(profileData),
            JSON.stringify(postData)
        );

        if (!persona) {
            return NextResponse.json({ error: 'Failed to create persona' }, { status: 500 });
        }

        // Update Supabase table with the generated persona
        const { error: updateError } = await supabase
            .from('user_personas')
            .update({
                introduction: persona?.introduction,
                uniqueness: persona?.uniqueness,
                audience: persona?.audience,
                value_proposition: persona?.value_proposition,
                style: persona?.style,
                goals: persona?.goals,
            })
            .eq('user_id', user.id);

        if (updateError) {
            throw new Error(`Failed to update persona in Supabase: ${updateError.message}`);
        }

        return NextResponse.json({ message: 'Persona generated and updated successfully', persona }, { status: 200 });
    } catch (error) {
        console.error('Error in create-persona API:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}