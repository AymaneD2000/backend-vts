import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { RidesService } from '../rides/rides.service';
import { User, UserRole } from '../users/entities/user.entity';
import { Merchant, MerchantStatus, MerchantType } from './entities/merchant.entity';
import { MerchantsService } from './merchants.service';

describe('MerchantsService applications', () => {
  let merchants: jest.Mocked<
    Pick<Repository<Merchant>, 'find' | 'findOne' | 'create' | 'save'>
  >;
  let users: jest.Mocked<Pick<Repository<User>, 'findOne' | 'save'>>;
  let service: MerchantsService;

  beforeEach(() => {
    merchants = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((value) => value as Merchant),
      save: jest.fn((value) => Promise.resolve(value as Merchant)),
    } as any;
    users = {
      findOne: jest.fn(),
      save: jest.fn((value) => Promise.resolve(value as User)),
    } as any;
    service = new MerchantsService(
      merchants as any,
      users as any,
      {} as RidesService,
      { get: jest.fn() } as unknown as ConfigService,
    );
  });

  it('creates a self-service application as pending for the current user', async () => {
    merchants.findOne.mockResolvedValue(null);

    const result = await service.apply('user-1', {
      name: 'Boutique Awa',
      type: MerchantType.STORE,
      address: 'Hippodrome, Bamako',
      lat: 12.65,
      lng: -7.98,
      phone: '71728143',
    });

    expect(merchants.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerUserId: 'user-1',
        status: MerchantStatus.PENDING,
      }),
    );
    expect(result.status).toBe(MerchantStatus.PENDING);
    expect(users.save).not.toHaveBeenCalled();
  });

  it('does not grant the merchant role while an admin record is pending', async () => {
    const pending = {
      id: 'merchant-1',
      ownerUserId: 'user-1',
      status: MerchantStatus.PENDING,
    } as Merchant;
    merchants.save.mockResolvedValue(pending);

    await service.create({
      name: 'Restaurant Mali',
      type: MerchantType.RESTAURANT,
      ownerUserId: 'user-1',
    });

    expect(users.findOne).not.toHaveBeenCalled();
    expect(users.save).not.toHaveBeenCalled();
  });

  it('grants the merchant role when an admin activates the application', async () => {
    const merchant = {
      id: 'merchant-1',
      ownerUserId: 'user-1',
      status: MerchantStatus.PENDING,
    } as Merchant;
    const owner = {
      id: 'user-1',
      roles: [UserRole.CLIENT],
    } as User;
    merchants.findOne.mockResolvedValue(merchant);
    merchants.save.mockImplementation((value) => Promise.resolve(value as Merchant));
    users.findOne.mockResolvedValue(owner);

    await service.update('merchant-1', { status: MerchantStatus.ACTIVE });

    expect(users.save).toHaveBeenCalledWith(
      expect.objectContaining({
        roles: [UserRole.CLIENT, UserRole.MERCHANT],
      }),
    );
  });

  it('stores a public logo URL only on a merchant owned by the user', async () => {
    const merchant = {
      id: 'merchant-1',
      ownerUserId: 'user-1',
      status: MerchantStatus.PENDING,
    } as Merchant;
    merchants.findOne.mockResolvedValue(merchant);

    const result = await service.saveLogo(
      'user-1',
      'merchant-1',
      'logo.jpg',
    );

    expect(merchants.findOne).toHaveBeenCalledWith({
      where: { id: 'merchant-1', ownerUserId: 'user-1' },
    });
    expect(result.logoUrl).toBe('/merchant-logos/logo.jpg');
  });

  it('lists only active merchants with map coordinates for discovery', async () => {
    merchants.find.mockResolvedValue([]);

    await service.activeMerchants();

    expect(merchants.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: MerchantStatus.ACTIVE }),
      }),
    );
  });
});
