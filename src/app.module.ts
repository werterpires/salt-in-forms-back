import { Module } from '@nestjs/common'
import { UtilsModuleModule } from './shared/utils-module/utils-module.module'
import { APP_FILTER, APP_GUARD } from '@nestjs/core'
import { GlobalErrorsFilter } from './shared/custom-error-handler/global-errors.filter'
import { CustomErrorHandlerService } from './shared/custom-error-handler/custom-error-handler.service'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { KnexModule } from 'nest-knexjs'
import { toSnakeCase } from './shared/utils'
import camelcaseKeys from 'camelcase-keys'
import { ScheduleModule } from '@nestjs/schedule'

import { config } from 'dotenv'
import { AuthModule } from './shared/auth/auth.module'
import { UsersModule } from './users/users.module'
import { JwtAuthGuard } from './shared/auth/guards/jwt-auth.guard'
import { RolesGuard } from './users/guards/roles.guard'
import { TermsModule } from './terms/terms.module'
import { ProcessesModule } from './processes/processes.module'
import { SFormsModule } from './s-forms/s-forms.module'
import { QuestionsAreasModule } from './questions-areas/questions-areas.module'
import { MinisterialsModule } from './ministerials/ministerials.module'
import { FormSectionsModule } from './form-sections/form-sections.module'
import { QuestionsModule } from './questions/questions.module';
import { CandidatesModule } from './candidates/candidates.module';
import { AnswersModule } from './answers/answers.module';
import { FormsCandidatesModule } from './forms-candidates/forms-candidates.module';

config()

const throttler = ThrottlerModule.forRoot({
  throttlers: [
    {
      ttl: 60000,
      limit: 120
    }
  ]
})

const knex = KnexModule.forRoot(
  {
    config: {
      client: 'mysql2',
      connection: {
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASS,
        database: process.env.SQL_DB,
        port: 3306,
        typeCast: function (field, next) {
          if (field.type === 'TINY' && field.length === 1) {
            // retorna tipo booleano ou null
            switch (field.string()) {
              case null:
              case undefined:
              case '':
              case 'null':
              case 'NULL':
                return null
              case '0':
                return false
              case '1':
                return true
            }
          } else if (field.type === 'DATE' && field.length > 1) {
            return field.string() // 1 = true, 0 = false
          } else if (field.type === 'DATETIME' && field.length > 1) {
            return field.string().substring(0, 10) // 1 = true, 0 = false
          }
          return next()
        }
      },
      wrapIdentifier: (value, origImpl) => origImpl(toSnakeCase(value)),
      postProcessResponse: (result) => {
        if (Array.isArray(result)) {
          return result.map((row) => camelcaseKeys(row, { deep: true }))
        }
        return camelcaseKeys(result, { deep: true })
      }
    }
  },
  'knexx'
)

@Module({
  imports: [
    UtilsModuleModule,
    throttler,
    knex,
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    TermsModule,
    ProcessesModule,
    SFormsModule,
    QuestionsAreasModule,
    MinisterialsModule,
    FormSectionsModule,
    QuestionsModule,
    CandidatesModule,
    AnswersModule,
    FormsCandidatesModule
  ],
  controllers: [],
  providers: [
    CustomErrorHandlerService,
    { provide: APP_FILTER, useClass: GlobalErrorsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    {
      provide: APP_GUARD,
      useClass: RolesGuard
    }
  ]
})
export class AppModule {}
