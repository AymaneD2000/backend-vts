import { RegisterTokenDto, UnregisterTokenDto } from './dto/register-token.dto';
import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notifications;
    constructor(notifications: NotificationsService);
    register(userId: string, dto: RegisterTokenDto): Promise<{
        message: string;
    }>;
    unregister(dto: UnregisterTokenDto): Promise<{
        message: string;
    }>;
}
