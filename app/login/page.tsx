import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[--bg] p-6">
      <div className="mx-auto max-w-md pt-20">
        <LoginForm />
      </div>
    </main>
  );
}
