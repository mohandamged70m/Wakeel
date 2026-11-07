import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { StandardSchemaValidationPipe } from "@nestjs/common";
import { Request } from "express";
import { SupabaseAuthGuard, type AuthUser } from "../../common/guards/supabase-auth.guard.js";
import { MenuRepository } from "../data/repositories/menu.repository.js";

const categorySchema = z.object({
  nameEn: z.string().min(1),
  nameAr: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

const itemSchema = z.object({
  categoryId: z.string().uuid().nullable().optional(),
  nameEn: z.string().min(1),
  nameAr: z.string().nullable().optional(),
  descriptionEn: z.string().nullable().optional(),
  descriptionAr: z.string().nullable().optional(),
  price: z.number().nonnegative(),
  currency: z.string().min(1),
  imageUrl: z.string().url().nullable().optional(),
  available: z.boolean().optional(),
  sku: z.string().nullable().optional(),
});

const itemPatchSchema = itemSchema.partial();

@ApiTags("menu")
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller("menu")
export class MenuController {
  constructor(private readonly menu: MenuRepository) {}

  @Get("categories")
  @ApiOperation({ summary: "List menu categories" })
  async listCategories(@Req() req: Request & { user: AuthUser }) {
    const items = await this.menu.listCategories(req.user.organizationId);
    return { items };
  }

  @Post("categories")
  @ApiOperation({ summary: "Create menu category" })
  async createCategory(
    @Req() req: Request & { user: AuthUser },
    @Body({ schema: categorySchema }) body: z.infer<typeof categorySchema>,
  ) {
    return this.menu.createCategory(req.user.organizationId, body.nameEn, body.nameAr ?? null, body.sortOrder ?? 0);
  }

  @Get("items")
  @ApiOperation({ summary: "List menu items" })
  async listItems(@Req() req: Request & { user: AuthUser }, @Query("categoryId") categoryId?: string) {
    const items = await this.menu.listItems(req.user.organizationId, categoryId);
    return { items };
  }

  @Post("items")
  @ApiOperation({ summary: "Create menu item" })
  async createItem(@Req() req: Request & { user: AuthUser }, @Body({ schema: itemSchema }) body: z.infer<typeof itemSchema>) {
    return this.menu.createItem(req.user.organizationId, {
      categoryId: body.categoryId ?? null,
      nameEn: body.nameEn,
      nameAr: body.nameAr ?? null,
      descriptionEn: body.descriptionEn ?? null,
      descriptionAr: body.descriptionAr ?? null,
      price: body.price,
      currency: body.currency,
      imageUrl: body.imageUrl ?? null,
      available: body.available ?? true,
      sku: body.sku ?? null,
    });
  }

  @Patch("items/:id")
  @ApiOperation({ summary: "Update menu item" })
  async updateItem(
    @Req() req: Request & { user: AuthUser },
    @Param("id") id: string,
    @Body({ schema: itemPatchSchema }) body: z.infer<typeof itemPatchSchema>,
  ) {
    return this.menu.updateItem(req.user.organizationId, id, body as Record<string, unknown> as never);
  }

  @Delete("items/:id")
  @ApiOperation({ summary: "Delete menu item" })
  async deleteItem(@Req() req: Request & { user: AuthUser }, @Param("id") id: string) {
    const ok = await this.menu.deleteItem(req.user.organizationId, id);
    return { deleted: ok };
  }
}
