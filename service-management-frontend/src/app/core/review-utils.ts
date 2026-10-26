import { Review } from './models';

export function summarize(reviews: Review[]) {
  const count = reviews.length;
  const average = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  return { count, average };
}
