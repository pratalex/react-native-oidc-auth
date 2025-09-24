export interface IProcess {
  setTimeout: (callback: () => void, ms: number) => NodeJS.Timeout;
}

export class Process implements IProcess {
  setTimeout(callback: () => void, ms: number): NodeJS.Timeout {
    return setTimeout(callback, ms);
  }
}
