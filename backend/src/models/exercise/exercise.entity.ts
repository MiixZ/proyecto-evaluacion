import { UUID } from '@CustomTypes/common.types';
import {
  DifficultyLevel,
  EfficiencyOrder,
  Timestamps,
} from '@CustomTypes/common.types';

/**
 * Mapeo directo de la tabla 'exercises'
 */
export interface ExerciseEntity extends Timestamps {
  id: UUID;
  syllabusId: UUID;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  language: string; // Código del lenguaje (python, java, etc)
  templateCode?: string | null;
  isPublished: boolean;
  createdBy: UUID; // Profesor que creó el ejercicio
  orderIndex?: number | null;
  points: number;
  efficiencyOrder: EfficiencyOrder;
  deadline?: Date | null;
  lateSubmissionPenaltyPercent: number;
  maxAttempts: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO para respuesta del ejercicio
 */
export interface ExerciseDTO {
  id: UUID;
  syllabusId: UUID;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  language: string;
  isPublished: boolean;
  points: number;
  maxAttempts: number;
  deadline?: Date | null;
}

/**
 * DTO para vista de estudiante (sin plantilla)
 */
export interface ExerciseStudentDTO extends ExerciseDTO {
  templateCode?: string | null;
  createdBy?: string;
}
