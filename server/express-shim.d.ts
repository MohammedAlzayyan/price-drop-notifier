declare module "express" {
  export interface Request {
    method: string;
    path: string;
    body?: any;
    [key: string]: any;
  }

  export interface Response {
    statusCode: number;
    json(body: any): this;
    status(code: number): this;
    send(body: any): this;
    sendFile(path: string): void;
    type(type: string): this;
    setHeader(name: string, value: string): void;
    on(event: string, cb: (...args: any[]) => void): void;
  }

  export type NextFunction = (...args: any[]) => void;

  export interface ExpressApp {
    use(...args: any[]): this;
    get(path: string, ...handlers: any[]): this;
    post(path: string, ...handlers: any[]): this;
    listen(port: number | string, cb?: () => void): void;
  }

  interface ExpressStatic {
    (root: string, options?: any): any;
  }

  interface ExpressNamespace {
    (): ExpressApp;
    json(): any;
    urlencoded(opts: any): any;
    static: ExpressStatic;
  }

  const express: ExpressNamespace;
  export default express;
}

