import { updateSession } from './utils/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    // Skip middleware for the landing page
    if (request.nextUrl.pathname === '/') {
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


