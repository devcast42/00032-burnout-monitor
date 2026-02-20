import LoginForm from "@/components/LoginForm";
import { demoAccounts } from "@/lib/auth";

type LoginPageProps = {
  searchParams?: { forbidden?: string };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const forbidden = searchParams?.forbidden === "1";
  return <LoginForm demoAccounts={demoAccounts} forbidden={forbidden} />;
}
