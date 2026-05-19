import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center">
      <div className="w-full">
        <AuthForm mode="signup" />
      </div>
    </div>
  );
}
