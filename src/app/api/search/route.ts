import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, services, categories } from "@/db/schema";
import { eq, ilike, or, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const searchTerm = `%${query}%`;

    // Search products
    const productResults = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        description: products.shortDescription,
      })
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          or(
            ilike(products.name, searchTerm),
            ilike(products.shortDescription, searchTerm)
          )
        )
      )
      .limit(5);

    // Search services
    const serviceResults = await db
      .select({
        id: services.id,
        name: services.name,
        slug: services.slug,
        description: services.shortDescription,
      })
      .from(services)
      .where(
        and(
          eq(services.isActive, true),
          or(
            ilike(services.name, searchTerm),
            ilike(services.shortDescription, searchTerm)
          )
        )
      )
      .limit(3);

    // Search categories
    const categoryResults = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
      })
      .from(categories)
      .where(
        and(
          eq(categories.isActive, true),
          or(
            ilike(categories.name, searchTerm),
            ilike(categories.description, searchTerm)
          )
        )
      )
      .limit(3);

    // Combine results
    const results = [
      ...productResults.map((p) => ({
        type: "product" as const,
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
      })),
      ...serviceResults.map((s) => ({
        type: "service" as const,
        id: s.id,
        name: s.name,
        slug: s.slug,
        description: s.description,
      })),
      ...categoryResults.map((c) => ({
        type: "category" as const,
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
      })),
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed", results: [] },
      { status: 500 }
    );
  }
}
