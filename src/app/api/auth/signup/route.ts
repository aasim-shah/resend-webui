import { NextResponse } from 'next/server';
import { findUserByEmail, createUser } from '@/lib/db/store';

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    const user = createUser(email, password, name);

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
    });

    response.cookies.set('resend_auth_user', JSON.stringify({ id: user.id, email: user.email, name: user.name }), {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Account registration failed' }, { status: 500 });
  }
}
