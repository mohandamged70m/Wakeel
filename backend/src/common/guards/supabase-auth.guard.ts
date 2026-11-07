import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { SupabaseService } from "../../modules/supabase/supabase.service.js";

export type AuthUser = {
  id: string;
  organizationId: string;
  role: "owner" | "staff";
};

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined>; user?: AuthUser }>();

    const authHeader = req.headers.authorization ?? req.headers.Authorization;
    const token =
      typeof authHeader === "string" && authHeader.toLowerCase().startsWith("bearer ")
        ? authHeader.slice(7).trim()
        : null;

    if (!token) throw new UnauthorizedException("Missing bearer token");
    if (!this.supabase.anonClient || !this.supabase.client) {
      throw new UnauthorizedException("Supabase not configured");
    }

    const { data, error } = await this.supabase.anonClient.auth.getUser(token);
    if (error || !data?.user) throw new UnauthorizedException("Invalid token");

    const { data: row, error: rowErr } = await this.supabase.client
      .from("users")
      .select("organization_id, role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (rowErr || !row) throw new ForbiddenException("User not provisioned");

    req.user = {
      id: data.user.id,
      organizationId: (row as { organization_id: string }).organization_id,
      role: (row as { role: "owner" | "staff" }).role,
    };

    const requiredRoles = this.reflector.get<string[]>("roles", context.getHandler());
    if (requiredRoles?.length && !requiredRoles.includes(req.user.role)) {
      throw new ForbiddenException("Insufficient role");
    }
    return true;
  }
}