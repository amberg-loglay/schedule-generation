export interface ConstructionPhase {
  enabled: boolean;
  duration?: number;
  overlap?: number;
  additionalFields?: { [key: string]: any };
}

export interface SiteEstablishment extends ConstructionPhase {
  mobiliseDuration: number;
  perimeterType: string;
  siteSheds: {
    enabled: boolean;
    duration: number;
    overlap: number;
  };
}

export interface Demolition extends ConstructionPhase {
  scaffolding: {
    enabled: boolean;
    erectionDuration: number;
    dismantleDuration: number;
  };
}

export interface Excavation extends ConstructionPhase {
  soilType: string;
  volume: number;
  dailyRate: number;
}

export interface Structure extends ConstructionPhase {
  concreteCoreIncluded: boolean;
  coreConstructionType: string;
  basementIncluded: boolean;
}

export interface Superstructure extends ConstructionPhase {
  floorsAboveGround: number;
  floorType: string;
}

export interface Facade extends ConstructionPhase {
  type: string;
  durationPerLevel: number;
}

export interface Fitout extends ConstructionPhase {
  baseDuration: number;
}

export interface ScheduleState {
  projectStartDate: string;
  buildingType: string;
  siteEstablishment: SiteEstablishment;
  demolition: Demolition;
  excavation: Excavation;
  structure: Structure;
  superstructure: Superstructure;
  facade: Facade;
  fitout: Fitout;
}

export interface Task {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  duration: number;
  phase?: string;
  dependencies?: string[];
  object_code?: string;
  object_count?: number;
  sequence?: number;
  level?: number;
  parent_id?: string;
}

export interface ScheduleResponse {
  success: boolean;
  message: string;
  schedule?: Task[];
  error?: string;
} 