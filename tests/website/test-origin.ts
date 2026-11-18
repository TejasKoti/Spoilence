const configuredPort = process.env.SPOILENCE_WEBSITE_TEST_PORT ?? "8791";
export const TEST_PORT = Number(configuredPort);
if (
  !/^\d+$/.test(configuredPort) ||
  !Number.isInteger(TEST_PORT) ||
  TEST_PORT < 1 ||
  TEST_PORT > 65535
)
  throw new Error("SPOILENCE_WEBSITE_TEST_PORT must be a valid TCP port.");
export const TEST_ORIGIN = `http://127.0.0.1:${TEST_PORT}`;
