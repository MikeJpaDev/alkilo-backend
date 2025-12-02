import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUserOptional = createParamDecorator(
  (data, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;

    // Retorna el usuario si existe, o undefined si no
    return user ? (!data ? user : user[data]) : undefined;
  },
);
