export interface IDateTime {
  getTime: () => number;
}

export class DateTime implements IDateTime {
  getTime(): number {
    return Date.now();
  }
}
