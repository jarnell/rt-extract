declare module 'gauge' {
  class Gauge {
    pulse(): void;
    show(status: string, completed?: number): void;
    hide(): void;
  }

  export = Gauge;
}
