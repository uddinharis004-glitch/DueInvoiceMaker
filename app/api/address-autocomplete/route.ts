import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { mapGeoapifyResults } from "@/lib/address-autocomplete";

const GEOAPIFY_AUTOCOMPLETE_URL = "https://api.geoapify.com/v1/geocode/autocomplete";

export async function GET(request: Request) {
  if (!(await requireApiAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 3 || query.length > 200) {
    return NextResponse.json({ error: "Enter between 3 and 200 characters." }, { status: 400 });
  }

  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Address autocomplete is not configured." }, { status: 503 });
  }

  const upstreamUrl = new URL(GEOAPIFY_AUTOCOMPLETE_URL);
  upstreamUrl.searchParams.set("text", query);
  upstreamUrl.searchParams.set("format", "json");
  upstreamUrl.searchParams.set("limit", "5");
  upstreamUrl.searchParams.set("lang", "en");
  upstreamUrl.searchParams.set("apiKey", apiKey);
  const countryCode = process.env.GEOAPIFY_COUNTRY_CODE?.trim().toLowerCase() ?? "us";
  if (countryCode) upstreamUrl.searchParams.set("filter", `countrycode:${countryCode}`);

  try {
    const response = await fetch(upstreamUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`Geoapify returned ${response.status}`);
    const payload = await response.json();
    return NextResponse.json({ suggestions: mapGeoapifyResults(payload) });
  } catch {
    return NextResponse.json({ error: "Address suggestions are temporarily unavailable." }, { status: 502 });
  }
}
