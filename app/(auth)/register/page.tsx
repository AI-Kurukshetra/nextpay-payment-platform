import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata = {
  title: "Register | NextPay"
};

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center p-6">
      <section className="glass w-full rounded-2xl p-6">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
          Create Merchant Account
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Register and start receiving live payment data in your dashboard.
        </p>

        <RegisterForm />

        <p className="mt-4 text-sm text-slate-600">
          Already have an account?{" "}
          <Link className="font-medium text-teal-700 hover:text-teal-800" href="/login">
            Login
          </Link>
        </p>
      </section>
    </main>
  );
}
