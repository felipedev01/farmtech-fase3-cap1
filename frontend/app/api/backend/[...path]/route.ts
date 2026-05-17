import { NextResponse, type NextRequest } from "next/server";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000").replace(
  /\/$/,
  "",
);

type RouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

function buildTargetUrl(request: NextRequest, pathSegments: string[] = []) {
  const target = new URL(`${API_BASE_URL}/${pathSegments.map(encodeURIComponent).join("/")}`);
  target.search = request.nextUrl.search;
  return target;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  const target = buildTargetUrl(request, params.path);

  try {
    const response = await fetch(target, {
      cache: "no-store",
      headers: {
        accept: "application/json",
      },
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      return NextResponse.json({
        __proxyError: true,
        status: response.status,
        detail: data?.detail ?? response.statusText,
      });
    }

    return NextResponse.json({ __proxyData: data });
  } catch (error) {
    return NextResponse.json({
      __proxyError: true,
      status: 502,
      detail: error instanceof Error ? error.message : "Falha ao consultar a API.",
    });
  }
}
