export interface LanguageEntity {
  code: string;
  name: string;
  version?: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface LanguageDTO {
  code: string;
  name: string;
  version?: string | null;
}
