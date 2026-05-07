export const parseAnchorageExpiryTime = (value: string): Date | null => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/);
  if (!match) return null;

  const [, year, month, day, hour, minute] = match;
  return new Date(
    Number.parseInt(year, 10),
    Number.parseInt(month, 10) - 1,
    Number.parseInt(day, 10),
    Number.parseInt(hour, 10),
    Number.parseInt(minute, 10),
  );
};

export const formatRemainingDuration = (expiryTime: string, currentTime: Date): string => {
  const expiryDate = parseAnchorageExpiryTime(expiryTime);
  if (!expiryDate) return '剩余: 待确认';

  const diffMs = expiryDate.getTime() - currentTime.getTime();
  if (diffMs <= 0) return '剩余: 00:00';

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `剩余: ${days}天${hours}小时`;
  if (hours > 0) return `剩余: ${hours}小时${minutes}分钟`;

  return `剩余: ${minutes}分钟`;
};

export const formatAnchorageRemainingDuration = (expiryTime: string, currentTime: Date) =>
  formatRemainingDuration(expiryTime, currentTime).replace(/ /g, '').replace(':', ': ');

export const getAnchorageExpiryMeta = (expiryTime: string) => {
  const [date = '--', time = '--:--'] = expiryTime.split(' ');
  return { date, time };
};

export const getAnchorageAvailabilityRatio = (occupied: number, capacity: number) => {
  const safeCapacity = Math.max(capacity, 0);
  const safeOccupied = Math.min(Math.max(occupied, 0), safeCapacity);
  const remaining = Math.max(safeCapacity - safeOccupied, 0);
  return safeCapacity > 0 ? remaining / safeCapacity : 0;
};
