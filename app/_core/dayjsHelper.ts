import dayjs, { Dayjs } from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);

export const ET = "America/New_York";

export function getEtTodayAsDayjs(): Dayjs {
  return dayjs().tz(ET);
}

export function getEtDateOrTodayAsDayjs(maybeDateString?: string): Dayjs {
  if (!maybeDateString) {
    return getEtTodayAsDayjs();
  }
  return dayjs.tz(maybeDateString, ET);
}

export function getMarketCloseTimeAsDayjs(maybeDateString?: string): Dayjs {
  const day = getEtDateOrTodayAsDayjs(maybeDateString).format("YYYY-MM-DD");
  return dayjs.tz(`${day} 16:00:00`, ET);
}

export function parseEtDateStringAsDayjs(dateString: string): Dayjs {
  return dayjs.tz(dateString, ET);
}

export function parseUnixSecondsAsDayjs(datetime: number): Dayjs {
  return dayjs.unix(datetime);
}

export function parseUnixMillisecondsAsDayjs(datetime: number): Dayjs {
  return dayjs(datetime);
}

export function checkIsBetween(date: Dayjs, start: Dayjs, end: Dayjs): boolean {
  return date.isBetween(start, end, "day", "[]");
}

export function checkIsSameOrAfterDay(date: Dayjs, start: Dayjs): boolean {
  return date.isSameOrAfter(start, "day");
}

export function isValidYYYYMMDD(dateString: string): boolean {
  return dayjs(dateString, "YYYY-MM-DD", true).isValid();
}
