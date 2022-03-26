import { Application } from 'express';

export default abstract class CommonRoutesConfig {
    constructor(public _app: Application, protected _name: string) {}
    get name(): string { return this._name}
    abstract configureRoutes(): Application;
}
