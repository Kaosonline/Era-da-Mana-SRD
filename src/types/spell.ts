export interface SpellClass {
  nome: string;
  nivel: number;
}

export interface SpellMetadata {
  escola: string;
  escolaSubtipo?: string;
  classes: SpellClass[];
  tempoConjuracao?: string;
  alcance?: string;
  duracao?: string;
  resistencia?: string;
  componentes?: string;
  area?: string;
}