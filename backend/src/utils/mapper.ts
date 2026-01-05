/**
 * Interfaz genérica para mappers que transforman entre capas de datos
 * @template Entity - Tipo de la entidad de dominio
 * @template DTO - Tipo del objeto de transferencia de datos
 * @template DatabaseRow - Tipo de la fila de base de datos
 */
export interface IMapper<Entity, DTO, DatabaseRow> {
  /**
   * Convierte una fila de base de datos en una entidad de dominio
   */
  toEntity(row: DatabaseRow): Entity;

  /**
   * Convierte una entidad de dominio en un DTO para la API
   */
  toDTO(entity: Entity): DTO;

  /**
   * Convierte un array de entidades en un array de DTOs
   */
  toDTOList(entities: Entity[]): DTO[];
}

/**
 * Clase base abstracta para implementar mappers con funcionalidad común
 * @template Entity - Tipo de la entidad de dominio
 * @template DTO - Tipo del objeto de transferencia de datos
 * @template DatabaseRow - Tipo de la fila de base de datos
 */
export abstract class BaseMapper<Entity, DTO, DatabaseRow> implements IMapper<
  Entity,
  DTO,
  DatabaseRow
> {
  abstract toEntity(row: DatabaseRow): Entity;
  abstract toDTO(entity: Entity): DTO;

  /**
   * Convierte un array de entidades en DTOs
   * @param entities - Array de entidades a convertir
   * @returns Array de DTOs
   */
  toDTOList(entities: Entity[]): DTO[] {
    return entities.map((entity) => this.toDTO(entity));
  }
}
