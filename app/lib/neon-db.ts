import "server-only";

type NeonSql = <T = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<T[]>;

type NeonServerlessModule = {
  neon: (connectionString: string) => NeonSql;
};

let sqlClient: NeonSql | null = null;
let hasWarnedMissingDatabase = false;
let hasWarnedMissingDriver = false;

export async function getNeonSql(): Promise<NeonSql | null> {
  if (sqlClient) {
    return sqlClient;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    if (!hasWarnedMissingDatabase) {
      hasWarnedMissingDatabase = true;
      console.warn(
        "[neon-db] DATABASE_URL is not configured. Skipping database writes.",
      );
    }

    return null;
  }

  const packageName = "@neondatabase/serverless";
  let serverlessModule: NeonServerlessModule;

  try {
    serverlessModule = (await import(
      /* webpackIgnore: true */ packageName
    )) as NeonServerlessModule;
  } catch (error) {
    if (!hasWarnedMissingDriver) {
      hasWarnedMissingDriver = true;
      console.warn(
        "[neon-db] @neondatabase/serverless is not installed. Run npm install before enabling database writes.",
        error,
      );
    }

    return null;
  }

  sqlClient = serverlessModule.neon(databaseUrl);
  return sqlClient;
}
