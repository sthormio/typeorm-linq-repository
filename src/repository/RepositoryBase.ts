import { IQuery } from "../query/interfaces/IQuery";
import { Query } from "../query/Query";
import { EntityBase } from "../types/EntityBase";
import { IRepositoryBase } from "./interfaces/IRepositoryBase";
import { DeleteResult, getConnectionManager, Repository, SelectQueryBuilder } from "typeorm";

/**
 * Base repository operations for TypeORM entities.
 */
export abstract class RepositoryBase<T extends EntityBase> implements IRepositoryBase<T> {
    protected readonly _repository: Repository<T>;

    private readonly _autoGenerateId: boolean;

    /**
     * Constructs the repository for the specified entity with, unless otherwise specified, a property named "id" that is auto-generated.
     * @param entityType The entity whose repository to create.
     * @param autoGenerateId True if the entity implements a property named "id" that is auto-generated; defaults to true.
     */
    public constructor(
        entityType: { new(...params: any[]): T; },
        autoGenerateId: boolean = true
    ) {
        this._repository = getConnectionManager().get().getRepository<T>(entityType);
        this._autoGenerateId = autoGenerateId;
    }

    public create<E extends T | T[]>(entities: E): Promise<E> {
        if (this._autoGenerateId) {
            // Set "id" to undefined in order to allow auto-generation.
            if (entities instanceof Array) {
                for (let entity of (<T[]>entities)) {
                    entity.id = undefined;
                }
            }
            else {
                (<T>entities).id = undefined;
            }
        }

        return this.update(entities);
    }

    public createQueryBuilder(alias: string): SelectQueryBuilder<T> {
        return this._repository.createQueryBuilder(alias);
    }

    public delete(entities: number | string | T | T[]): Promise<boolean> {
        let deletePromise: Promise<DeleteResult | T | T[]> = null;

        if (typeof (entities) === "number") {
            deletePromise = this._repository.delete(entities);
        }
        else {
            deletePromise = this._repository.remove(<any>entities);
        }

        return deletePromise.then(() => {
            return Promise.resolve(true);
        });
    }

    public getAll(): IQuery<T, T[]> {
        const queryBuilder: SelectQueryBuilder<T> = this.createQueryBuilder("entity");
        const query: IQuery<T, T[]> = new Query(
            queryBuilder, queryBuilder.getMany
        );
        return query;
    }

    public getById(id: number | string): IQuery<T, T> {
        const alias: string = "entity";
        let queryBuilder: SelectQueryBuilder<T> = this.createQueryBuilder(alias);
        queryBuilder = queryBuilder.where(`${alias}.id = :id`, { id: id });
        const query: IQuery<T, T> = new Query(
            queryBuilder, queryBuilder.getOne
        );
        return query;
    }

    public getOne(): IQuery<T, T> {
        const queryBuilder: SelectQueryBuilder<T> = this.createQueryBuilder("entity");
        const query: IQuery<T, T> = new Query(
            queryBuilder, queryBuilder.getOne
        );
        return query;
    }

    public update<E extends T | T[]>(entities: E): Promise<E> {
        return <Promise<E>>this._repository.save(<any>entities);
    }
}