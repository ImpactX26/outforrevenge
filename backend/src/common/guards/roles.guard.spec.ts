import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../enums';

describe('RolesGuard (RBAC Security)', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(userRole?: UserRole): ExecutionContext {
    return {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({
          user: userRole ? { id: 'u1', email: 'test@example.com', role: userRole } : null,
        }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
    const ctx = createMockContext(UserRole.APPLICANT);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('CRITICAL: should reject APPLICANT trying to access ADMIN endpoint with 403 Forbidden', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    const ctx = createMockContext(UserRole.APPLICANT);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('CRITICAL: should reject APPLICANT trying to access CONSULTANT endpoint with 403 Forbidden', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.CONSULTANT]);
    const ctx = createMockContext(UserRole.APPLICANT);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should allow ADMIN to access ADMIN endpoint', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    const ctx = createMockContext(UserRole.ADMIN);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow CONSULTANT to access CONSULTANT endpoint', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.CONSULTANT, UserRole.ADMIN]);
    const ctx = createMockContext(UserRole.CONSULTANT);
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
