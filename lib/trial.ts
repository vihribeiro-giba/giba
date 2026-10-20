export const FREE_TRIAL_DAYS = 15;

export function createFreeTrialPeriod(start = new Date()) {
  const end = new Date(start);
  end.setDate(end.getDate() + FREE_TRIAL_DAYS);

  return { start, end };
}
