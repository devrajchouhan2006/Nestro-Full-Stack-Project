import { NextResponse } from 'next/server'

// Runs before an /admin page is rendered. The cookie only proves *a* session
// exists — the backend's requireAdmin re-reads the role from the database on
// every API call, and that is what actually protects the data.
export function middleware(request) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('token')?.value

  if (pathname.startsWith('/admin') && !token) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin-login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // A signed-in shopper landing on the login screen goes straight through.
  if (pathname === '/admin-login' && token) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/admin-login'],
}
