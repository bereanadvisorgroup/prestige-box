import { ForgotPasswordForm } from "../../_components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="flex h-dvh">
      <div className="hidden bg-primary lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            <img
              src="https://assets.agentfire3.com/uploads/sites/2548/2026/01/Prestige-Advisors-logo-white-210xAUTO.fit.png"
              alt="Prestige Advisors Logo"
              className="mx-auto h-12 w-auto object-contain"
            />
            <div className="mt-8 space-y-2">
              <h1 className="font-light text-4xl text-primary-foreground">Trouble Logging In?</h1>
              <p className="text-lg text-primary-foreground/80">Reset your client portal password</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-background p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-10 py-24 lg:py-32">
          <div className="space-y-4 text-center">
            <div className="font-medium tracking-tight">Reset Password</div>
            <div className="mx-auto max-w-xl text-muted-foreground">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </div>
          </div>
          <div className="space-y-4">
            <ForgotPasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}
