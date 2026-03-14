import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Login | PayForge"
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center p-6">
      <section className="glass w-full rounded-2xl p-6">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
          Merchant Login
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in with your merchant API key to access the live dashboard.
        </p>

        <LoginForm />

        <p className="mt-4 text-sm text-slate-600">
          New merchant?{" "}
          <Link className="font-medium text-teal-700 hover:text-teal-800" href="/register">
            Create account
          </Link>
        </p>
      </section>
    </main>
  );
}
