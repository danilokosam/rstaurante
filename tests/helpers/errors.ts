/**
 * Awaits an operation that must fail and returns its error message plus the
 * field validation messages, which is what the admin panel shows to the user.
 */
export async function rejectionMessage(promise: Promise<unknown>): Promise<string> {
  try {
    await promise
  } catch (error) {
    const data = (error as { data?: { errors?: { message: string }[] } }).data
    return [
      error instanceof Error ? error.message : '',
      ...(data?.errors?.map((e) => e.message) ?? []),
    ].join(' | ')
  }
  throw new Error('Expected the operation to be rejected')
}
