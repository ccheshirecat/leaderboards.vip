import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SuperTokensService } from '../supertokens.service';
import { GqlExecutionContext } from '@nestjs/graphql';

interface RequestWithUser {
  tenantId: string;
  headers: {
    authorization: string;
  };
  user?: Record<string, any>;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly superTokensService: SuperTokensService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Handle both HTTP and GraphQL requests
    const request = this.getRequest(context);
    const tenantId = request.tenantId;

    if (!tenantId) {
      throw new UnauthorizedException('Tenant ID not found');
    }

    // Extract the token from the Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header not found');
    }

    const [type, token] = authHeader.split(' ') as [string, string];
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization format');
    }

    // Verify the token
    const verifiedSession = await this.superTokensService.verifyJwt(
      tenantId,
      token,
    );
    if (!verifiedSession) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Attach the user to the request
    request.user = verifiedSession.user;

    return true;
  }

  private getRequest(context: ExecutionContext): RequestWithUser {
    // Handle both HTTP and GraphQL requests
    if (context.getType() === 'http') {
      return context.switchToHttp().getRequest();
    }

    // GraphQL request - cast to RequestWithUser to ensure type safety
    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext<{ req: RequestWithUser }>().req;
    return req;
  }
}
