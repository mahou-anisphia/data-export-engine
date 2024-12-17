export interface FlatDataEntry {
  timestamp: string | number;
  key: string;
  value: any;
  partition: string;
}

export interface KeyOrganizedEntry {
  key: string;
  partition: string;
  value: any;
  timestamp: string | number;
}

export interface PartitionOrganizedEntry {
  partition: string;
  timestamp: string | number;
  [key: string]: any; // Dynamic keys for sensor values
}
