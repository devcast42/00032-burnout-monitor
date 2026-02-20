import LoginForm from "@/components/LoginForm";

type LoginPageProps = {
  searchParams?: Promise<{ forbidden?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const forbidden = resolvedSearchParams?.forbidden === "1";
  return <LoginForm forbidden={forbidden} />;
}
