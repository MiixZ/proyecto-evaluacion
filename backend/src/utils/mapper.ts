export interface IMapper<Entity, DTO, DatabaseRow> {
  toEntity(row: DatabaseRow): Entity;
  toDTO(entity: Entity): DTO;
  toDTOList(entities: Entity[]): DTO[];
}

export abstract class BaseMapper<Entity, DTO, DatabaseRow> implements IMapper<
  Entity,
  DTO,
  DatabaseRow
> {
  abstract toEntity(row: DatabaseRow): Entity;
  abstract toDTO(entity: Entity): DTO;

  toDTOList(entities: Entity[]): DTO[] {
    return entities.map((entity) => this.toDTO(entity));
  }
}
