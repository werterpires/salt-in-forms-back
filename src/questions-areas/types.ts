export interface CreateQuestionArea {
  questionAreaName: string
  questionAreaDescription: string
}

export interface UpdateQuestionArea {
  questionAreaId: number
  questionAreaName: string
  questionAreaDescription: string
  questionAreaActive: boolean
}

export type QuestionArea = UpdateQuestionArea

export interface QuestionsAreasFilter {
  questionAreaName?: string
  questionAreaActive?: boolean
}
