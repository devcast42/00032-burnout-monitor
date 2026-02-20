import "server-only";
import { pool } from "@/lib/db";

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
  const result = await pool.query(
    `
    SELECT
      u.id,
      u.name,
      u.email,
      s.date as "surveyDate",
      s.score as "surveyScore",
      s.created_at as "surveyCreatedAt"
    FROM users u
    LEFT JOIN LATERAL (
      SELECT date, score, created_at
      FROM surveys
      WHERE user_id = u.id
      ORDER BY date DESC
      LIMIT 1
    ) s ON true
    WHERE u.manager_id = $1
    ORDER BY u.name ASC
    `,
    [managerId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    lastSurvey: row.surveyDate
      ? {
          date: row.surveyDate,
          score: row.surveyScore,
          createdAt: row.surveyCreatedAt,
        }
      : null,
  }));
}
