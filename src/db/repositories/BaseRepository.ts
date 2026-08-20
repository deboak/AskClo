import { Model, ModelClass, PartialModelObject } from "objection";

export interface QueryOptions {
  graph?: string;
}

export abstract class BaseRepository<M extends Model> {
  protected abstract model: ModelClass<M>;

  protected query() {
    return this.model.query();
  }

  protected applyOptions(query: any, options?: QueryOptions): any {
    if (options?.graph) {
      query.withGraphFetched(options.graph);
    }

    return query;
  }

  async findById(id: string | number, options?: QueryOptions): Promise<M | undefined> {
    return this.applyOptions(this.model.query().findById(id), options) as unknown as Promise<M | undefined>;
  }

  async findOne(where: PartialModelObject<M>, options?: QueryOptions): Promise<M | undefined> {
    return this.applyOptions(
      this.model.query().findOne(where as Record<string, unknown>),
      options,
    ) as unknown as Promise<M | undefined>;
  }

  async findAll(where?: PartialModelObject<M>, options?: QueryOptions): Promise<M[]> {
    const q = this.model.query();
    if (where) q.where(where as Record<string, unknown>);
    return this.applyOptions(q, options) as unknown as Promise<M[]>;
  }

  async create(data: PartialModelObject<M>): Promise<M> {
    return this.model.query().insertAndFetch(data) as unknown as Promise<M>;
  }

  async updateById(id: string | number, data: PartialModelObject<M>): Promise<M> {
    return this.model
      .query()
      .patchAndFetchById(id, data) as unknown as Promise<M>;
  }

  async deleteById(id: string | number): Promise<number> {
    return this.model.query().deleteById(id) as unknown as Promise<number>;
  }

  async exists(where: PartialModelObject<M>): Promise<boolean> {
    const result = await this.model
      .query()
      .findOne(where as Record<string, unknown>)
      .select(1);
    return !!result;
  }
}
