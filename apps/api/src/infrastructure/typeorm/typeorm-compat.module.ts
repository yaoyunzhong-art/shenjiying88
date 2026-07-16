import { Global, Module } from '@nestjs/common'
import { DataSource, EntityManager, Repository } from 'typeorm'

function createQueryBuilderStub() {
  const builder: Record<string, unknown> = {
    select: () => builder,
    addSelect: () => builder,
    from: () => builder,
    where: () => builder,
    andWhere: () => builder,
    orWhere: () => builder,
    innerJoin: () => builder,
    leftJoin: () => builder,
    leftJoinAndSelect: () => builder,
    innerJoinAndSelect: () => builder,
    orderBy: () => builder,
    addOrderBy: () => builder,
    groupBy: () => builder,
    addGroupBy: () => builder,
    having: () => builder,
    andHaving: () => builder,
    limit: () => builder,
    offset: () => builder,
    take: () => builder,
    skip: () => builder,
    insert: () => builder,
    update: () => builder,
    delete: () => builder,
    values: () => builder,
    set: () => builder,
    into: () => builder,
    returning: () => builder,
    setParameter: () => builder,
    setParameters: () => builder,
    getMany: async () => [],
    getRawMany: async () => [],
    getOne: async () => null,
    getRawOne: async () => null,
    getManyAndCount: async () => [[], 0],
    getCount: async () => 0,
    execute: async () => ({ raw: [], affected: 0 }),
  }
  return builder
}

function createRepositoryStub(entityManagerFactory: () => EntityManager): Repository<any> {
  const repository: Record<string, unknown> = {
    create: (input?: unknown) => input ?? {},
    merge: (target: Record<string, unknown>, ...sources: Record<string, unknown>[]) =>
      Object.assign(target ?? {}, ...sources),
    preload: async (input?: unknown) => input ?? null,
    save: async (input?: unknown) => input,
    insert: async () => ({ identifiers: [], generatedMaps: [], raw: [] }),
    update: async () => ({ affected: 0, generatedMaps: [], raw: [] }),
    upsert: async () => ({ identifiers: [], generatedMaps: [], raw: [] }),
    delete: async () => ({ affected: 0, raw: [] }),
    softDelete: async () => ({ affected: 0, raw: [] }),
    restore: async () => ({ affected: 0, raw: [] }),
    remove: async (input?: unknown) => input,
    softRemove: async (input?: unknown) => input,
    recover: async (input?: unknown) => input,
    find: async () => [],
    findBy: async () => [],
    findAndCount: async () => [[], 0],
    findOne: async () => null,
    findOneBy: async () => null,
    count: async () => 0,
    countBy: async () => 0,
    exists: async () => false,
    existsBy: async () => false,
    query: async () => [],
    clear: async () => undefined,
    createQueryBuilder: () => createQueryBuilderStub(),
  }

  Object.defineProperty(repository, 'manager', {
    enumerable: true,
    get: entityManagerFactory,
  })

  return new Proxy(repository, {
    get(target, prop) {
      if (prop in target) return Reflect.get(target, prop)
      if (prop === 'then' || prop === 'catch' || prop === 'finally') return undefined
      return (..._args: unknown[]) => undefined
    },
  }) as unknown as Repository<any>
}

function createTypeOrmCompatDataSource(): DataSource {
  const repositories = new Map<unknown, Repository<any>>()
  let entityManager: EntityManager

  const getRepository = (target?: unknown): Repository<any> => {
    const key = target ?? 'default'
    if (!repositories.has(key)) {
      repositories.set(key, createRepositoryStub(() => entityManager))
    }
    return repositories.get(key)!
  }

  const managerLike: Record<string, unknown> = {
    transaction: async <T>(cb: (manager: EntityManager) => Promise<T> | T) => cb(entityManager),
    getRepository,
    save: async (_targetOrEntity: unknown, maybeEntity?: unknown) =>
      maybeEntity === undefined ? _targetOrEntity : maybeEntity,
    find: async () => [],
    findOne: async () => null,
    query: async () => [],
  }

  entityManager = new Proxy(managerLike, {
    get(target, prop) {
      if (prop in target) return Reflect.get(target, prop)
      if (prop === 'then' || prop === 'catch' || prop === 'finally') return undefined
      return (..._args: unknown[]) => undefined
    },
  }) as unknown as EntityManager

  const dataSourceLike: Record<string, unknown> = {
    isInitialized: true,
    manager: entityManager,
    entityMetadatas: [],
    initialize: async () => dataSource,
    destroy: async () => undefined,
    getRepository,
    getTreeRepository: getRepository,
    getMongoRepository: getRepository,
    createEntityManager: () => entityManager,
    transaction: async <T>(cb: (manager: EntityManager) => Promise<T> | T) => cb(entityManager),
    query: async () => [],
    createQueryRunner: () => ({
      manager: entityManager,
      connect: async () => undefined,
      startTransaction: async () => undefined,
      commitTransaction: async () => undefined,
      rollbackTransaction: async () => undefined,
      release: async () => undefined,
      query: async () => [],
    }),
  }

  const dataSource = new Proxy(dataSourceLike, {
    get(target, prop) {
      if (prop in target) return Reflect.get(target, prop)
      if (prop === 'then' || prop === 'catch' || prop === 'finally') return undefined
      return (..._args: unknown[]) => undefined
    },
  }) as unknown as DataSource

  return dataSource
}

@Global()
@Module({
  providers: [
    {
      provide: DataSource,
      useFactory: createTypeOrmCompatDataSource,
    },
    {
      provide: EntityManager,
      useFactory: (dataSource: DataSource) => dataSource.manager,
      inject: [DataSource],
    },
  ],
  exports: [DataSource, EntityManager],
})
export class TypeOrmCompatModule {}
