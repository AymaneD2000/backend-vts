import { Global, Module } from '@nestjs/common';
import { UsersModule } from '../modules/users/users.module';
import { CurrentRolesService } from './current-roles.service';
import { RolesGuard } from './roles.guard';

@Global()
@Module({
  imports: [UsersModule],
  providers: [CurrentRolesService, RolesGuard],
  exports: [CurrentRolesService, RolesGuard],
})
export class AuthorizationModule {}
