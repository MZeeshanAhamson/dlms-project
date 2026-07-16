"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import type { ActionState } from "@/lib/actions/state";

export async function loginAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard?flash=welcome",
    });
    return { status: "success" };
  } catch (error) {
    if (error instanceof AuthError) {
      return { status: "error", message: "The email or password is incorrect, or the account is inactive." };
    }
    throw error;
  }
}
