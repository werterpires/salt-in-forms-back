import * as db from '../constants/db-schema.enum'
export interface CreateProcess {
  [db.Processes.PROCESS_TITLE]: string
  [db.Processes.PROCESS_TOTVS_ID]: string
  [db.Processes.PROCESS_BEGIN_DATE]: Date
  [db.Processes.PROCESS_END_DATE]?: Date
}

export interface ProcessesFilter {
  title?: string
  status?: ProcessStatus
}

export type ProcessStatus = 'draft' | 'active' | 'completed'
