import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center">
      <div className="w-full">
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
