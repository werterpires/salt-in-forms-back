import * as db from '../constants/db-schema.enum'
export interface CreateProcess {
  [db.Processes.PROCESS_TITLE]: string
  [db.Processes.PROCESS_TOTVS_ID]: string
  [db.Processes.PROCESS_BEGIN_DATE]: Date
  [db.Processes.PROCESS_END_DATE]: Date
  [db.Processes.PROCESS_END_ANSWERS]: Date
  [db.Processes.PROCESS_END_SUBSCRIPTION]: Date
}

export interface UpdateProcess extends CreateProcess {
  [db.Processes.PROCESS_ID]: number
}

export type Process = UpdateProcess

export interface ProcessesFilter {
  title?: string
  status?: ProcessStatus
}

export type ProcessStatus = 'draft' | 'active' | 'completed'

export interface ProcessSimple {
  [db.Processes.PROCESS_ID]: number
  [db.Processes.PROCESS_TITLE]: string
}
