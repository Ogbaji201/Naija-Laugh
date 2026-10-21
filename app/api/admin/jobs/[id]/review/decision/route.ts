import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

type Decision = "approve" | "flag" | "reject";

export async function POST(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const body = await request.json();
    const decision = body.decision as Decision;

    const validDecisions: Decision[] = [
      "approve",
      "flag",
      "reject",
    ];

    if (!validDecisions.includes(decision)) {
      return NextResponse.json(
        {
          error: "Invalid decision.",
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Confirm the job exists
    const { data: existingJob, error: fetchError } =
      await supabase
        .from("jobs")
        .select("id, slug")
        .eq("id", id)
        .single();

    if (fetchError || !existingJob) {
      return NextResponse.json(
        {
          error: "Job not found.",
        },
        { status: 404 }
      );
    }

    // Map the administrator's decision to the job status.
    //
    // Approve -> approved
    // Flag    -> review
    // Reject  -> rejected
    const status =
      decision === "approve"
        ? "approved"
        : decision === "flag"
          ? "review"
          : "rejected";

    const { data: updatedJob, error: updateError } =
      await supabase
        .from("jobs")
        .update({
          status,
        })
        .eq("id", id)
        .select("*")
        .single();

    if (updateError) {
      console.error(
        "Failed to update job decision:",
        updateError
      );

      return NextResponse.json(
        {
          error: "Unable to save the administrator decision.",
        },
        { status: 500 }
      );
    }

    // Refresh the relevant pages.
    revalidatePath("/admin/jobs");
    revalidatePath(`/admin/jobs/${id}`);
    revalidatePath("/jobs");
    revalidatePath(`/jobs/${existingJob.slug}`);

    return NextResponse.json({
      success: true,
      decision,
      status,
      job: updatedJob,
    });
  } catch (error) {
    console.error(
      "Job decision error:",
      error
    );

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