import { NextResponse } from "next/server";
import { SignJWT } from "jose";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "default-secret");

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (
      username !== process.env.AUTH_USERNAME ||
      password !== process.env.AUTH_PASSWORD
    ) {
      return NextResponse.json(
        { error: 1, message: "用户名或密码错误" },
        { status: 401 }
      );
    }

    const token = await new SignJWT({ sub: username })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(secret);

    const response = NextResponse.json({ error: 0 });
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 1, message: "登录失败" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ error: 0 });
  response.cookies.set("auth_token", "", { path: "/", maxAge: 0 });
  return response;
}
