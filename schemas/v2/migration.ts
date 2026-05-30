export const from_v1 = (event: unknown): unknown => {
  const e = event as Record<string, unknown>;
  return {
    ...e,
    output: e['result'],
    metadata: (e['metadata'] as Record<string, unknown>) ?? {},
  };
};
