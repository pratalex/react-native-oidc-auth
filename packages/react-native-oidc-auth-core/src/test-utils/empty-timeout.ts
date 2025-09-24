export class EmptyTimeout implements NodeJS.Timeout {
  constructor(private resetCallback: () => void) {}

  [Symbol.dispose](): void {
    this.resetCallback();
  }

  [Symbol.toPrimitive](): number {
    return 0;
  }

  _onTimeout(...args: any[]): void {}

  close(): this {
    this.resetCallback();
    return this;
  }

  hasRef(): boolean {
    return true;
  }

  ref(): this;
  ref(): this;
  ref(): this {
    return this;
  }

  refresh(): this;
  refresh(): this;
  refresh(): this {
    return this;
  }

  unref(): this;
  unref(): this;
  unref(): this {
    this.resetCallback();
    return this;
  }
}
