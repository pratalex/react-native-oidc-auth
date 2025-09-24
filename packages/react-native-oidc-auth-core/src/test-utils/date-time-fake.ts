import {IDateTime} from '@/utils/date-time';

export class DateTimeFake implements IDateTime {
  constructor(private nowInMillis: number) {}

  getTime(): number {
    return this.nowInMillis;
  }
}
