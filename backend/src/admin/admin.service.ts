import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { Opportunity } from '../database/entities/opportunity.entity';
import { QualificationRequirement } from '../database/entities/qualification-requirement.entity';
import { EducaroService } from '../database/entities/educaro-service.entity';
import { RoutingRule } from '../database/entities/routing-rule.entity';
import { AgentExecution } from '../database/entities/agent-execution.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { UserRole } from '../common/enums';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Opportunity)
    private readonly oppRepo: Repository<Opportunity>,
    @InjectRepository(QualificationRequirement)
    private readonly reqRepo: Repository<QualificationRequirement>,
    @InjectRepository(EducaroService)
    private readonly serviceRepo: Repository<EducaroService>,
    @InjectRepository(RoutingRule)
    private readonly ruleRepo: Repository<RoutingRule>,
    @InjectRepository(AgentExecution)
    private readonly execRepo: Repository<AgentExecution>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async getAllUsers(role?: UserRole) {
    const query = this.userRepo.createQueryBuilder('u')
      .leftJoinAndSelect('u.profile', 'profile')
      .orderBy('u.createdAt', 'DESC');

    if (role) {
      query.where('u.role = :role', { role });
    }

    return query.getMany();
  }

  async getAnalytics() {
    const totalUsers = await this.userRepo.count();
    const applicantsCount = await this.userRepo.count({ where: { role: UserRole.APPLICANT } });
    const consultantsCount = await this.userRepo.count({ where: { role: UserRole.CONSULTANT } });
    const totalExecutions = await this.execRepo.count();
    const opportunitiesCount = await this.oppRepo.count();
    const servicesCount = await this.serviceRepo.count();

    const recentExecutions = await this.execRepo.find({
      order: { createdAt: 'DESC' },
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
    return this.execRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['applicant'],
    });
  }

  async getAuditLogs(limit = 50) {
    return this.auditRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['user'],
    });
  }

  // Opportunity CRUD
  async createOpportunity(data: Partial<Opportunity>) {
    const opp = this.oppRepo.create(data);
    return this.oppRepo.save(opp);
  }

  async updateOpportunity(id: string, data: Partial<Opportunity>) {
    const opp = await this.oppRepo.findOne({ where: { id } });
    if (!opp) throw new NotFoundException('Opportunity not found');
    Object.assign(opp, data);
    return this.oppRepo.save(opp);
  }

  async deleteOpportunity(id: string) {
    const opp = await this.oppRepo.findOne({ where: { id } });
    if (!opp) throw new NotFoundException('Opportunity not found');
    await this.oppRepo.remove(opp);
    return { success: true };
  }

  // Requirements CRUD
  async getRequirements() {
    return this.reqRepo.find({ order: { pathway: 'ASC', weight: 'DESC' } });
  }

  async createRequirement(data: Partial<QualificationRequirement>) {
    const req = this.reqRepo.create(data);
    return this.reqRepo.save(req);
  }

  async updateRequirement(id: string, data: Partial<QualificationRequirement>) {
    const req = await this.reqRepo.findOne({ where: { id } });
    if (!req) throw new NotFoundException('Requirement not found');
    Object.assign(req, data);
    return this.reqRepo.save(req);
  }

  async deleteRequirement(id: string) {
    const req = await this.reqRepo.findOne({ where: { id } });
    if (!req) throw new NotFoundException('Requirement not found');
    await this.reqRepo.remove(req);
    return { success: true };
  }

  // Educaro Services CRUD
  async getServices() {
    return this.serviceRepo.find({ order: { createdAt: 'ASC' } });
  }

  async createService(data: Partial<EducaroService>) {
    const svc = this.serviceRepo.create(data);
    return this.serviceRepo.save(svc);
  }

  async updateService(id: string, data: Partial<EducaroService>) {
    const svc = await this.serviceRepo.findOne({ where: { id } });
    if (!svc) throw new NotFoundException('Service not found');
    Object.assign(svc, data);
    return this.serviceRepo.save(svc);
  }

  async deleteService(id: string) {
    const svc = await this.serviceRepo.findOne({ where: { id } });
    if (!svc) throw new NotFoundException('Service not found');
    await this.serviceRepo.remove(svc);
    return { success: true };
  }

  // Routing Rules CRUD
  async getRules() {
    return this.ruleRepo.find({
      order: { priority: 'DESC' },
      relations: ['targetService'],
    });
  }

  async createRule(data: Partial<RoutingRule>) {
    const rule = this.ruleRepo.create(data);
    return this.ruleRepo.save(rule);
  }

  async updateRule(id: string, data: Partial<RoutingRule>) {
    const rule = await this.ruleRepo.findOne({ where: { id } });
    if (!rule) throw new NotFoundException('Rule not found');
    Object.assign(rule, data);
    return this.ruleRepo.save(rule);
  }

  async deleteRule(id: string) {
    const rule = await this.ruleRepo.findOne({ where: { id } });
    if (!rule) throw new NotFoundException('Rule not found');
    await this.ruleRepo.remove(rule);
    return { success: true };
  }
}
