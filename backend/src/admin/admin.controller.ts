import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@ApiTags('Admin')
@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'Admin list all registered users' })
  async getUsers(@Query('role') role?: UserRole) {
    const users = await this.adminService.getAllUsers(role);
    return { success: true, users };
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Systemwide analytics and live agent metrics' })
  async getAnalytics() {
    return this.adminService.getAnalytics();
  }

  @Get('agents')
  @ApiOperation({ summary: 'Inspect agent executions and orchestrator decisions' })
  async getAgentExecutions(@Query('limit') limit?: number) {
    const executions = await this.adminService.getAgentExecutions(limit);
    return { success: true, executions };
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'View immutable system audit logs' })
  async getAuditLogs(@Query('limit') limit?: number) {
    const logs = await this.adminService.getAuditLogs(limit);
    return { success: true, logs };
  }

  // Opportunities CRUD
  @Post('opportunities')
  @ApiOperation({ summary: 'Create new database opportunity' })
  async createOpportunity(@Body() data: any) {
    const opp = await this.adminService.createOpportunity(data);
    return { success: true, opportunity: opp };
  }

  @Put('opportunities/:id')
  @ApiOperation({ summary: 'Update opportunity' })
  async updateOpportunity(@Param('id') id: string, @Body() data: any) {
    const opp = await this.adminService.updateOpportunity(id, data);
    return { success: true, opportunity: opp };
  }

  @Delete('opportunities/:id')
  @ApiOperation({ summary: 'Delete opportunity' })
  async deleteOpportunity(@Param('id') id: string) {
    return this.adminService.deleteOpportunity(id);
  }

  // Requirements CRUD
  @Get('requirements')
  @ApiOperation({ summary: 'Get all qualification requirements' })
  async getRequirements() {
    const requirements = await this.adminService.getRequirements();
    return { success: true, requirements };
  }

  @Post('requirements')
  @ApiOperation({ summary: 'Create new qualification requirement' })
  async createRequirement(@Body() data: any) {
    const req = await this.adminService.createRequirement(data);
    return { success: true, requirement: req };
  }

  @Put('requirements/:id')
  @ApiOperation({ summary: 'Update qualification requirement' })
  async updateRequirement(@Param('id') id: string, @Body() data: any) {
    const req = await this.adminService.updateRequirement(id, data);
    return { success: true, requirement: req };
  }

  @Delete('requirements/:id')
  @ApiOperation({ summary: 'Delete qualification requirement' })
  async deleteRequirement(@Param('id') id: string) {
    return this.adminService.deleteRequirement(id);
  }

  // Educaro Services CRUD
  @Get('educaro-services')
  @ApiOperation({ summary: 'Get all Educaro services catalog' })
  async getServices() {
    const services = await this.adminService.getServices();
    return { success: true, services };
  }

  @Post('educaro-services')
  @ApiOperation({ summary: 'Create Educaro service' })
  async createService(@Body() data: any) {
    const svc = await this.adminService.createService(data);
    return { success: true, service: svc };
  }

  @Put('educaro-services/:id')
  @ApiOperation({ summary: 'Update Educaro service' })
  async updateService(@Param('id') id: string, @Body() data: any) {
    const svc = await this.adminService.updateService(id, data);
    return { success: true, service: svc };
  }

  @Delete('educaro-services/:id')
  @ApiOperation({ summary: 'Delete Educaro service' })
  async deleteService(@Param('id') id: string) {
    return this.adminService.deleteService(id);
  }

  // Routing Rules CRUD
  @Get('routing-rules')
  @ApiOperation({ summary: 'Get all routing rules' })
  async getRules() {
    const rules = await this.adminService.getRules();
    return { success: true, rules };
  }

  @Post('routing-rules')
  @ApiOperation({ summary: 'Create routing rule' })
  async createRule(@Body() data: any) {
    const rule = await this.adminService.createRule(data);
    return { success: true, rule };
  }

  @Put('routing-rules/:id')
  @ApiOperation({ summary: 'Update routing rule' })
  async updateRule(@Param('id') id: string, @Body() data: any) {
    const rule = await this.adminService.updateRule(id, data);
    return { success: true, rule };
  }

  @Delete('routing-rules/:id')
  @ApiOperation({ summary: 'Delete routing rule' })
  async deleteRule(@Param('id') id: string) {
    return this.adminService.deleteRule(id);
  }
}
