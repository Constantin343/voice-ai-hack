import { NextResponse } from 'next/server'

// Get invite code from environment variable
const VALID_INVITE_CODE = process.env.INVITE_CODE

if (!VALID_INVITE_CODE) {
    throw new Error('INVITE_CODE environment variable is not set')
}

export async function POST(request: Request) {
    try {
        const { code } = await request.json()
        
        // Simple validation using env variable
        const isValid = code === VALID_INVITE_CODE

        return NextResponse.json({ 
            valid: isValid 
        })
    } catch (error) {
        console.error('Error validating invite code:', error)
        return NextResponse.json(
            { error: 'Invalid request' },
            { status: 400 }
        )
    }
} 