import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const supabase = createAdminClient();

    // Get the current job status
    const { data: job, error: fetchError } =
      await supabase
        .from("jobs")
        .select("id, slug, title, status")
        .eq("id", id)
        .single();

    if (fetchError || !job) {
      return NextResponse.json(
        {
          error: "Job not found.",
        },
        { status: 404 }
      );
    }

    // Only human-approved jobs can be published.
    if (job.status !== "approved") {
      return NextResponse.json(
        {
          error:
            "This job must be approved by an administrator before it can be published.",
        },
        { status: 400 }
      );
    }

    const { data: updatedJob, error: updateError } =
      await supabase
        .from("jobs")
        .update({
          status: "published",
        })
        .eq("id", id)
        .select("*")
        .single();

    if (updateError) {
      console.error(
        "Failed to publish job:",
        updateError
      );

      return NextResponse.json(
        {
          error: "Unable to publish the job.",
        },
        { status: 500 }
      );
    }

    // Refresh admin and public job pages.
    revalidatePath("/admin/jobs");
    revalidatePath(`/admin/jobs/${id}`);
    revalidatePath("/jobs");
    revalidatePath(`/jobs/${job.slug}`);

    return NextResponse.json({
      success: true,
      message: "Job published successfully.",
      job: updatedJob,
    });
  } catch (error) {
    console.error("Publish job error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
      },
      { status: 500 }
    );
  }
}