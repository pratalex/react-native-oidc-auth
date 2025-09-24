import {IProcess} from '@/utils/process';
import {EmptyTimeout} from '@/test-utils/empty-timeout';
import {IDateTime} from '@/utils/date-time';
import {DateTime} from 'luxon';

export class ProcessFake implements IProcess {
  private timeToFire: number = 0;
  private nextTickCallback: (() => void) | null = null;

  constructor(private dateTime: IDateTime) {}

  setTimeout(callback: () => void, ms: number): NodeJS.Timeout {
    this.timeToFire = DateTime.fromMillis(this.dateTime.getTime())
      .plus({millisecond: ms})
      .toMillis();
    this.nextTickCallback = callback;

    this.nextTick();

    return new EmptyTimeout(() => this.reset());
  }

  nextTick(timeInSeconds: number = 1): void {
    let now = DateTime.fromMillis(this.dateTime.getTime())
      .plus({seconds: timeInSeconds})
      .toMillis();

    if (now >= this.timeToFire) {
      this.nextTickCallback?.();
      this.reset();
    }
  }

  private reset() {
    this.nextTickCallback = null;
    this.timeToFire = 0;
  }
}
