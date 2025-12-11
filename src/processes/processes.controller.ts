import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Put
} from '@nestjs/common'
import { ProcessesService } from './processes.service'
import { CreateProcessDto } from './dto/create-process.dto'
import { UpdateProcessDto } from './dto/update-process.dto'
import { Roles } from 'src/users/decorators/roles.decorator'
import { ERoles } from 'src/constants/roles.const'
import * as db from 'src/constants/db-schema.enum'
import { Paginator } from 'src/shared/types/types'
import { ProcessesFilter, ProcessStatus, PublicProcessDto } from './types'
import { IsPublic } from 'src/shared/auth/decorators/is-public.decorator'

@Controller('processes')
export class ProcessesController {
  constructor(private readonly processesService: ProcessesService) {}

  @Roles(ERoles.ADMIN)
  @Post()
  async create(@Body() createProcessDto: CreateProcessDto) {
    return await this.processesService.createProcess(createProcessDto)
  }

  @Roles(ERoles.ADMIN, ERoles.SEC)
  @Get()
  async findAll(
    @Query('direction') direction: string,
    @Query('page') page: string,
    @Query('column') column: string,
    @Query('status') status: string,
    @Query('title') title: string
  ) {
    const paginator = new Paginator<typeof db.Processes>(
      +page,
      direction,
      column,
      db.Processes.PROCESS_BEGIN_DATE,
      db.Processes
    )

    const filters: ProcessesFilter = {
      status: (status as ProcessStatus) || undefined,
      title: title || undefined
    }

    return await this.processesService.findAllProcesses(paginator, filters)
  }

  @Roles(ERoles.ADMIN)
  @Put()
  async update(@Body() updateProcessDto: UpdateProcessDto) {
    return await this.processesService.updateProcess(updateProcessDto)
  }

  @IsPublic()
  @Get('public/active')
  async findActiveProcesses(): Promise<PublicProcessDto[]> {
    return await this.processesService.findActiveProcesses()
  }

  @Roles(ERoles.ADMIN, ERoles.SEC)
  @Get('all')
  async findAllProcessesSimple() {
    return await this.processesService.findAllProcessesSimple()
  }

  @Roles(ERoles.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.processesService.deleteProcess(+id)
  }
}
