// authority.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CanActivate } from '@nestjs/common';

@Injectable()
export class AuthorityGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredAuthority = this.reflector.get<string>(
      'authority',
      context.getHandler(),
    );
    if (!requiredAuthority) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return user.authority === requiredAuthority;
  }
}
