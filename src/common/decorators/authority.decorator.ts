import { SetMetadata } from '@nestjs/common';
export const Authority = (authority: string) =>
  SetMetadata('authority', authority);
