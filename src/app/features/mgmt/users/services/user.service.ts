import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { UsersService as UsersApiService } from '../../../../generated/openapi/notip-management-api-openapi/api/users.service';
import {
  CreateUserRequestDto,
  CreateUserRequestDtoRoleEnum,
} from '../../../../generated/openapi/notip-management-api-openapi/model/create-user-request-dto';
import { CreateUserResponseDto } from '../../../../generated/openapi/notip-management-api-openapi/model/create-user-response-dto';
import {
  UpdateUserRequestDto,
  UpdateUserRequestDtoRoleEnum,
} from '../../../../generated/openapi/notip-management-api-openapi/model/update-user-request-dto';
import { UpdateUserResponseDto } from '../../../../generated/openapi/notip-management-api-openapi/model/update-user-response-dto';
import { UserResponseDto } from '../../../../generated/openapi/notip-management-api-openapi/model/user-response-dto';
import {
  CreatedUser,
  DeleteUserFeedback,
  UpdateUserParameters,
  UpdatedUser,
  UserParameters,
  ViewUser,
} from '../../../../core/models/user';
import { UserRole } from '../../../../core/models/enums';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly usersApi = inject(UsersApiService);

  getUsers(): Observable<ViewUser[]> {
    return this.usersApi.usersControllerGetUsers().pipe(
      map((rows: UserResponseDto[]) =>
        rows.map((row) => ({
          userId: row.id,
          username: row.username,
          email: row.email,
          role: this.toUserRole(row.role),
          lastAccess: row.last_access,
        })),
      ),
    );
  }

  createUser(up: UserParameters): Observable<CreatedUser> {
    const body: CreateUserRequestDto = {
      username: up.username,
      email: up.email,
      role: this.toCreateRole(up.role),
      password: up.password,
    };

    return this.usersApi.usersControllerCreateUser(body).pipe(
      map((res: CreateUserResponseDto) => ({
        userId: res.id,
        username: res.username,
        email: res.email,
        role: this.toUserRole(res.role),
        createdAt: res.created_at,
      })),
    );
  }

  updateUser(userId: string, u: UpdateUserParameters): Observable<UpdatedUser> {
    const body: UpdateUserRequestDto = {
      username: u.username ?? '',
      email: u.email ?? '',
      role: this.toUpdateRole(u.role ?? UserRole.tenant_user),
      permissions: [],
    };

    return this.usersApi.usersControllerUpdateUser(userId, body).pipe(
      map((res: UpdateUserResponseDto) => ({
        userId: res.id,
        username: res.username,
        email: res.email,
        role: this.toUserRole(res.role),
        updatedAt: res.updated_at,
      })),
    );
  }

  deleteUsers(userIds: string[]): Observable<DeleteUserFeedback> {
    return this.usersApi
      .usersControllerDeleteUsers({ ids: userIds })
      .pipe(map((res) => ({ deleted: res.deleted, failed: res.failed })));
  }

  private toCreateRole(role: UserRole): CreateUserRequestDtoRoleEnum {
    switch (role) {
      case UserRole.system_admin:
        return CreateUserRequestDtoRoleEnum.SystemAdmin;
      case UserRole.tenant_admin:
        return CreateUserRequestDtoRoleEnum.TenantAdmin;
      default:
        return CreateUserRequestDtoRoleEnum.TenantUser;
    }
  }

  private toUpdateRole(role: UserRole): UpdateUserRequestDtoRoleEnum {
    switch (role) {
      case UserRole.system_admin:
        return UpdateUserRequestDtoRoleEnum.SystemAdmin;
      case UserRole.tenant_admin:
        return UpdateUserRequestDtoRoleEnum.TenantAdmin;
      default:
        return UpdateUserRequestDtoRoleEnum.TenantUser;
    }
  }

  private toUserRole(role: string): UserRole {
    switch (role) {
      case 'system_admin':
        return UserRole.system_admin;
      case 'tenant_admin':
        return UserRole.tenant_admin;
      default:
        return UserRole.tenant_user;
    }
  }
}
