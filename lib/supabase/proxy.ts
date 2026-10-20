import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic =
    path === "/" ||
    path === "/login" ||
    path === "/signup" ||
    path === "/join" ||
    path.startsWith("/auth/callback");
  const isMember = user?.user_metadata?.role === "member";
  const home = isMember ? "/member" : "/home";

  if (!user && !isPublic) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && (path === "/login" || path === "/signup" || path === "/join" || path === "/")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = home;
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isMember && !path.startsWith("/member") && !path.startsWith("/auth/callback")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/member";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && !isMember && path.startsWith("/member")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/home";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
