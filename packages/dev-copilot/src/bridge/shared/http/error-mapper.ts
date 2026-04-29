export const toBridgeErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return "브리지 서버 처리 중 오류가 발생했습니다.";
};
