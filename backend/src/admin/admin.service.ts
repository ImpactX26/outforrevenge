import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../common/enums';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllUsers(role?: UserRole) {
    return this.prisma.user.findMany({
      where: role ? { role } : undefined,
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAnalytics() {
    const totalUsers = await this.prisma.user.count();
    const applicantsCount = await this.prisma.user.count({ where: { role: UserRole.APPLICANT } });
    const consultantsCount = await this.prisma.user.count({ where: { role: UserRole.CONSULTANT } });
    const totalExecutions = await this.prisma.agentExecution.count();
    const opportunitiesCount = await this.prisma.opportunity.count();
    const servicesCount = await this.prisma.educaroService.count();

    const recentExecutions = await this.prisma.agentExecution.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      metrics: {
        totalUsers,
        applicantsCount,
        consultantsCount,
        totalExecutions,
        opportunitiesCount,
        servicesCount,
      },
      recentExecutions,
    };
  }

  async getAgentExecutions(limit = 50) {
    return this.prisma.agentExecution.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { applicant: true },
    });
  }

  async getAuditLogs(limit = 50) {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: true },
    });
  }

  // Opportunity CRUD
  async createOpportunity(data: any) {
    return this.prisma.opportunity.create({ data });
  }

  async updateOpportunity(id: string, data: any) {
    const opp = await this.prisma.opportunity.findUnique({ where: { id } });
    if (!opp) throw new NotFoundException('Opportunity not found');
    return this.prisma.opportunity.update({
      where: { id },
      data,
    });
  }

  async deleteOpportunity(id: string) {
    const opp = await this.prisma.opportunity.findUnique({ where: { id } });
    if (!opp) throw new NotFoundException('Opportunity not found');
    await this.prisma.opportunity.delete({ where: { id } });
    return { success: true };
  }

  // Requirements CRUD
  async getRequirements() {
    return this.prisma.qualificationRequirement.findMany({
      orderBy: [{ pathway: 'asc' }, { weight: 'desc' }],
    });
  }

  async createRequirement(data: any) {
    return this.prisma.qualificationRequirement.create({ data });
  }

  async updateRequirement(id: string, data: any) {
    const req = await this.prisma.qualificationRequirement.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Requirement not found');
    return this.prisma.qualificationRequirement.update({
      where: { id },
      data,
    });
  }

  async deleteRequirement(id: string) {
    const req = await this.prisma.qualificationRequirement.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Requirement not found');
    await this.prisma.qualificationRequirement.delete({ where: { id } });
    return { success: true };
  }

  // Educaro Services CRUD
  async getServices() {
    return this.prisma.educaroService.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async createService(data: any) {
    return this.prisma.educaroService.create({ data });
  }

  async updateService(id: string, data: any) {
    const svc = await this.prisma.educaroService.findUnique({ where: { id } });
    if (!svc) throw new NotFoundException('Service not found');
    return this.prisma.educaroService.update({
      where: { id },
      data,
    });
  }

  async deleteService(id: string) {
    const svc = await this.prisma.educaroService.findUnique({ where: { id } });
    if (!svc) throw new NotFoundException('Service not found');
    await this.prisma.educaroService.delete({ where: { id } });
    return { success: true };
  }

  // Routing Rules CRUD
  async getRules() {
    return this.prisma.routingRule.findMany({
      orderBy: { priority: 'desc' },
      include: { targetService: true },
    });
  }

  async createRule(data: any) {
    return this.prisma.routingRule.create({ data });
  }

  async updateRule(id: string, data: any) {
    const rule = await this.prisma.routingRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Rule not found');
    return this.prisma.routingRule.update({
      where: { id },
      data,
    });
  }

  async deleteRule(id: string) {
    const rule = await this.prisma.routingRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Rule not found');
    await this.prisma.routingRule.delete({ where: { id } });
    return { success: true };
  }
}
