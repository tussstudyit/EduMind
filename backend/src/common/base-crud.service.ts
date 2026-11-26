import { NotFoundException } from '@nestjs/common';
import { DeepPartial, ObjectLiteral, Repository } from 'typeorm';

export abstract class BaseCrudService<T extends ObjectLiteral & { id: string }> {
  protected constructor(
    protected readonly repository: Repository<T>,
    private readonly resourceName: string,
  ) {}

  findAll(): Promise<T[]> {
    return this.repository.find();
  }

  async findOne(id: string): Promise<T> {
    const record = await this.repository.findOne({ where: { id } as never });
    if (!record) throw new NotFoundException(`${this.resourceName} không tồn tại.`);
    return record;
  }

  create(data: DeepPartial<T>): Promise<T> {
    return this.repository.save(this.repository.create(data));
  }

  async update(id: string, data: DeepPartial<T>): Promise<T> {
    const record = await this.findOne(id);
    const definedEntries = Object.entries(data as Record<string, unknown>).filter(
      ([key, val]) => key !== 'id' && val !== undefined,
    );
    this.repository.merge(record, Object.fromEntries(definedEntries) as DeepPartial<T>);
    return this.repository.save(record);
  }

  async remove(id: string): Promise<{ deleted: true }> {
    const record = await this.findOne(id);
    await this.repository.remove(record);
    return { deleted: true };
  }
}
