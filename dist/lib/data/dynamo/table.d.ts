import { CreateItemOptions, ModelConfiguration, UpdateItemOptions, DestroyItemOptions } from 'dynogels';
import { Dynamo } from './dynamo';
export declare abstract class DynamoTable<T> {
    private dynamo;
    protected abstract tableName: string;
    protected abstract definition: ModelConfiguration;
    private _model;
    constructor(dynamo: Dynamo);
    protected registerTable(): void;
    create(data: {
        [key: string]: {};
    }, options?: CreateItemOptions): Promise<T>;
    getAll(): Promise<T[]>;
    getAllRaw(): Promise<{}[]>;
    protected getAllBase(transform: (x: any[]) => any): Promise<any[]>;
    protected update(data: {
        [key: string]: {};
    }, options?: UpdateItemOptions): Promise<T>;
    protected delete(hashKey: string, rangeKey?: string, options?: DestroyItemOptions): Promise<T>;
    protected abstract transformToModel(createdModel: any): T;
}