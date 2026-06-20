import { ClientSetupForm } from "../../_components/client-setup-form";

export default function ClientSetupPage() {
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
              <h1 className="font-light text-4xl text-primary-foreground">Secure Portal</h1>
              <p className="text-lg text-primary-foreground/80">Set up your client portal account</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-background p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-10 py-24 lg:py-32">
          <div className="space-y-4 text-center">
            <div className="font-medium tracking-tight">Welcome to Prestige Advisors</div>
            <div className="mx-auto max-w-xl text-muted-foreground">
              Please choose how you'd like to log in, or set a secure password for your new account.
            </div>
          </div>
          <div className="space-y-4">
            <ClientSetupForm />
          </div>
        </div>
      </div>
    </div>
  );
}
