import { LoginForm } from "../../_components/login-form";

export default function LoginV1() {
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
              <h1 className="font-light text-4xl text-primary-foreground">Welcome Back</h1>
              <p className="text-lg text-primary-foreground/80">Sign in to your client portal</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-background p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-10 py-24 lg:py-32">
          <div className="space-y-4 text-center">
            <div className="font-medium tracking-tight">Login</div>
            <div className="mx-auto max-w-xl text-muted-foreground">
              Enter your credentials to access your financial dashboard and advisory tools.
            </div>
          </div>
          <div className="space-y-4">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
