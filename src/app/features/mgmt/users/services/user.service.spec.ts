import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CreateUserRequestDtoRoleEnum,
  UpdateUserRequestDtoRoleEnum,
  UsersService as UsersApiService,
} from '../../../../generated/openapi/notip-management-api-openapi';
import { UserRole } from '../../../../core/models/enums';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;

  const apiMock = {
    usersControllerGetUsers: vi.fn(),
    usersControllerCreateUser: vi.fn(),
    usersControllerUpdateUser: vi.fn(),
    usersControllerDeleteUsers: vi.fn(),
  };

  beforeEach(async () => {
    apiMock.usersControllerGetUsers.mockReset();
    apiMock.usersControllerCreateUser.mockReset();
    apiMock.usersControllerUpdateUser.mockReset();
    apiMock.usersControllerDeleteUsers.mockReset();

    await TestBed.configureTestingModule({
      providers: [UserService, { provide: UsersApiService, useValue: apiMock }],
    }).compileComponents();

    service = TestBed.inject(UserService);
  });

  it('maps users list and role fallback', async () => {
    apiMock.usersControllerGetUsers.mockReturnValue(
      of([
        {
          id: 'u-1',
          username: 'Alice',
          email: 'a@test.dev',
          role: 'system_admin',
          last_access: '2026-03-31',
        },
        {
          id: 'u-2',
          username: 'Bob',
          email: 'b@test.dev',
          role: 'invalid',
          last_access: null,
        },
      ]),
    );

    await expect(firstValueFrom(service.getUsers())).resolves.toEqual([
      {
        userId: 'u-1',
        username: 'Alice',
        email: 'a@test.dev',
        role: UserRole.system_admin,
        lastAccess: '2026-03-31',
      },
      {
        userId: 'u-2',
        username: 'Bob',
        email: 'b@test.dev',
        role: UserRole.tenant_user,
        lastAccess: null,
      },
    ]);
  });

  it('creates user with mapped enum role', async () => {
    apiMock.usersControllerCreateUser.mockReturnValue(
      of({
        id: 'u-3',
        username: 'Carol',
        email: 'c@test.dev',
        role: 'tenant_admin',
        created_at: '2026-03-31',
      }),
    );

    await firstValueFrom(
      service.createUser({
        username: ' Carol ',
        email: 'c@test.dev',
        password: 'Strong123',
        role: UserRole.system_admin,
      }),
    );

    expect(apiMock.usersControllerCreateUser).toHaveBeenCalledWith({
      username: 'Carol',
      email: 'c@test.dev',
      role: CreateUserRequestDtoRoleEnum.TenantUser,
      password: 'Strong123',
    });
  });

  it('updates user using default fallbacks when fields are missing', async () => {
    apiMock.usersControllerUpdateUser.mockReturnValue(
      of({ id: 'u-4', username: '', email: '', role: 'tenant_user', updated_at: '2026-03-31' }),
    );

    await firstValueFrom(service.updateUser('u-4', {}));

    expect(apiMock.usersControllerUpdateUser).toHaveBeenCalledWith('u-4', {
      username: '',
      email: '',
      role: UpdateUserRequestDtoRoleEnum.TenantUser,
      permissions: [],
    });
  });

  it('deletes users and maps feedback', async () => {
    apiMock.usersControllerDeleteUsers.mockReturnValue(of({ deleted: 2, failed: ['u-9'] }));

    await expect(firstValueFrom(service.deleteUsers(['u-1', 'u-2']))).resolves.toEqual({
      deleted: 2,
      failed: ['u-9'],
    });
    expect(apiMock.usersControllerDeleteUsers).toHaveBeenCalledWith({ ids: ['u-1', 'u-2'] });
  });

  it('maps tenant admin role in update payload', async () => {
    apiMock.usersControllerUpdateUser.mockReturnValue(
      of({
        id: 'u-5',
        username: 'X',
        email: 'x@test.dev',
        role: 'tenant_admin',
        updated_at: '2026-03-31',
      }),
    );

    await firstValueFrom(service.updateUser('u-5', { role: UserRole.tenant_admin }));

    expect(apiMock.usersControllerUpdateUser).toHaveBeenCalledWith('u-5', {
      username: '',
      email: '',
      role: UpdateUserRequestDtoRoleEnum.TenantAdmin,
      permissions: [],
    });
  });
});
