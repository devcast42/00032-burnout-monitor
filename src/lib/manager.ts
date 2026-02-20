import "server-only";
import { prisma } from "@/lib/db";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  lastSurvey: {
    date: string;
    score: number;
    createdAt: string;
  } | null;
};

export async function getTeamMembers(managerId: string): Promise<TeamMember[]> {
  const subordinates = await prisma.user.findMany({
    where: { managerId },
    orderBy: { name: "asc" },
    include: {
      surveys: {
        orderBy: { date: "desc" },
        take: 1,
      },
    },
  });

  type SubordinateWithSurveys = Awaited<ReturnType<typeof prisma.user.findMany>>[number] & {
    surveys: Awaited<ReturnType<typeof prisma.survey.findMany>>;
  };

  return (subordinates as SubordinateWithSurveys[]).map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    lastSurvey: user.surveys[0]
      ? {
        date: user.surveys[0].date,
        score: user.surveys[0].score,
        createdAt: user.surveys[0].createdAt?.toISOString() ?? "",
      }
      : null,
  }));
}
