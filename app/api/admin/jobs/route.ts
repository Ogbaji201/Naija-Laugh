import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function createSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function createUniqueSlug(
  supabase: ReturnType<typeof createAdminClient>,
  title: string
) {
  const baseSlug = createSlug(title);

  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const { data, error } = await supabase
      .from("jobs")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Unable to check job slug: ${error.message}`
      );
    }

    if (!data) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      title,
      company_name,
      company_logo_url,
      category,
      experience_level,
      employment_type,
      work_type,
      location,
      country,
      summary,
      description,
      requirements,
      responsibilities,
      salary_min,
      salary_max,
      salary_currency,
      application_deadline,
      application_url,
      source_url,
      source_name,
      status,
      featured,
    } = body;

    /* ---------------------------------------------
       BASIC VALIDATION
       --------------------------------------------- */

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Job title is required." },
        { status: 400 }
      );
    }

    if (!company_name?.trim()) {
      return NextResponse.json(
        { error: "Company name is required." },
        { status: 400 }
      );
    }

    if (!application_url?.trim()) {
      return NextResponse.json(
        { error: "Application URL is required." },
        { status: 400 }
      );
    }

    const allowedStatuses = [
      "pending",
      "review",
      "approved",
      "published",
    ];

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid job status." },
        { status: 400 }
      );
    }

    /* ---------------------------------------------
       SUPABASE
       --------------------------------------------- */

    const supabase = createAdminClient();

    /* ---------------------------------------------
       UNIQUE SLUG
       --------------------------------------------- */

    const slug = await createUniqueSlug(
      supabase,
      title
    );

    /* ---------------------------------------------
       INSERT JOB
       --------------------------------------------- */

    const { data, error } = await supabase
      .from("jobs")
      .insert({
        title: title.trim(),
        slug,

        company_name: company_name.trim(),
        company_logo_url:
          company_logo_url?.trim() || null,

        category: category?.trim() || null,
        experience_level:
          experience_level?.trim() || null,
        employment_type:
          employment_type?.trim() || null,
        work_type: work_type?.trim() || null,

        location: location?.trim() || null,
        country: country?.trim() || "Nigeria",

        summary: summary?.trim() || null,
        description: description?.trim() || null,
        requirements:
          requirements?.trim() || null,
        responsibilities:
          responsibilities?.trim() || null,

        salary_min:
          salary_min !== null &&
          salary_min !== undefined &&
          salary_min !== ""
            ? Number(salary_min)
            : null,

        salary_max:
          salary_max !== null &&
          salary_max !== undefined &&
          salary_max !== ""
            ? Number(salary_max)
            : null,

        salary_currency:
          salary_currency?.trim() || null,

        date_posted: new Date().toISOString(),

        application_deadline:
          application_deadline || null,

        application_url:
          application_url.trim(),

        source_url:
          source_url?.trim() || null,

        source_name:
          source_name?.trim() || null,

        status,

        featured: Boolean(featured),
      })
      .select("*")
      .single();

    if (error) {
      console.error(
        "Create job Supabase error:",
        error
      );

      return NextResponse.json(
        {
          error:
            error.message ||
            "Unable to create job.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        job: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create job API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create job.",
      },
      { status: 500 }
    );
  }
}