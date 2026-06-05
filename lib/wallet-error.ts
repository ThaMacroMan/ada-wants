export function isUserRejectedWalletError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /declin|reject|cancel/i.test(message);
}
