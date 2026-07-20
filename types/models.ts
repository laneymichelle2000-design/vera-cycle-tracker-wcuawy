export interface Medicine {
  id: string;
  name: string;
  type: 'pill' | 'injection' | 'patch' | 'ring' | 'other';
  color: string;
  dosage: string;
  times: string[];
  notes: string;
  active: boolean;
  createdAt: string;
}

export interface DoseLog {
  id: string;
  medicineId: string;
  scheduledTime: string;
  takenAt: string | null;
  status: 'taken' | 'missed' | 'skipped';
  date: string;
}

export interface CycleEntry {
  id: string;
  date: string;
  flow: 'none' | 'spotting' | 'light' | 'medium' | 'heavy';
  symptoms: string[];
  mood: 'great' | 'good' | 'okay' | 'bad' | null;
  notes: string;
}

export interface HealthNote {
  id: string;
  date: string;
  content: string;
  tags: string[];
  createdAt: string;
}
