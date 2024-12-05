import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { handleUserAgentConnection } from '@/utils/supabase/user-management'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const isRegistration = searchParams.get('registration') === 'true'
    const inviteCode = searchParams.get('invite')
    
    console.log('Callback received:', { 
        code, 
        isRegistration, 
        inviteCode,
        allParams: Object.fromEntries(searchParams.entries())
    })
    
    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            const forwardedHost = request.headers.get('x-forwarded-host')
            
            const { data: { user } } = await supabase.auth.getUser()
            
            if (user) {
                console.log('User authenticated:', { userId: user.id, metadata: user.user_metadata })

                // Check if user exists in your users table
                const { data: existingUser } = await supabase
                    .from('users')
                    .select('user_id')
                    .eq('user_id', user.id)
                    .single()

                if (!existingUser) {
                    // This is a new user
                    if (!isRegistration || inviteCode !== 'EARLY-ACCESS-2024') {
                        console.log('Registration validation failed:', { isRegistration, inviteCode })
                        await supabase.auth.signOut()
                        return NextResponse.redirect(`${origin}/login?error=not_registered`)
                    }

                    console.log('Creating new user in database')

                    // Create the user in the database
                    const { error: insertError } = await supabase
                        .from('users')
                        .insert([
                            {
                                user_id: user.id,
                                email: user.email,
                                full_name: user.user_metadata.full_name,
                                avatar_url: user.user_metadata.avatar_url,
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString(),
                                linkedin_id: user.user_metadata.sub,
                                is_onboarded: false
                            }
                        ])

                    if (insertError) {
                        console.error('Error creating user:', insertError)
                        await supabase.auth.signOut()
                        return NextResponse.redirect(`${origin}/login?error=registration_failed`)
                    }
                }

                try {
                    await handleUserAgentConnection(supabase, user.id)
                } catch (error) {
                    console.error('Error in user connection:', error)
                }
            }
 
            const isLocalEnv = process.env.NODE_ENV === 'development'
            const next = '/home'
            
            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                return NextResponse.redirect(`${origin}${next}`)
            }
        }
    }

    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}