export const toErrorMessage = (error: unknown, fallbackMessage: string) => {
  return error instanceof Error ? error.message : fallbackMessage;
};
