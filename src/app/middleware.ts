import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
    // Percorsi protetti
    const protectedPaths = ['/dashboard'];

    // Se l'utente è su una pagina protetta
    if (protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
        const token = request.cookies.get('auth-token')?.value;

        if (!token) {
            // Reindirizza al login con redirect
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*']
};
