export { auth as proxy } from "@/auth";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/applicants/:path*",
    "/applications/:path*",
    "/licenses/:path*",
    "/reports/:path*",
  ],
};
