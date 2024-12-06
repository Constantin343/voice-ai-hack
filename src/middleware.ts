import { updateSession } from './utils/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    // Public paths that should bypass authentication
    const publicPaths = [
        '/',
        '/api/stripe/webhook',
        '/api/stripe/test',
        '/login',
        '/register',
        '/auth/callback',
        '/auth/confirm'
    ]

    // Check if the current path is in publicPaths
    if (publicPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
        return NextResponse.next()
    }
    
    return await updateSession(request)
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
        '/api/agent/:path*'
    ],
}
