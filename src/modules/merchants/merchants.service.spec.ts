import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { RidesService } from '../rides/rides.service';
import { User, UserRole } from '../users/entities/user.entity';
import { Merchant, MerchantStatus, MerchantType } from './entities/merchant.entity';
import { ProductCategory } from './entities/product-category.entity';
import { Product } from './entities/product.entity';
import { Promotion } from './entities/promotion.entity';
import { MerchantsService } from './merchants.service';

describe('MerchantsService applications', () => {
  let merchants: jest.Mocked<
    Pick<Repository<Merchant>, 'find' | 'findOne' | 'create' | 'save'>
  >;
  let categories: jest.Mocked<
    Pick<Repository<ProductCategory>, 'find' | 'findOne' | 'create' | 'save'>
  >;
  let products: jest.Mocked<
    Pick<Repository<Product>, 'find' | 'findOne' | 'create' | 'save'>
  >;
  let promotions: jest.Mocked<
    Pick<Repository<Promotion>, 'find' | 'findOne' | 'create' | 'save'>
  >;
  let users: jest.Mocked<Pick<Repository<User>, 'findOne' | 'save'>>;
  let service: MerchantsService;

  beforeEach(() => {
    merchants = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn((value) => value as Merchant),
      save: jest.fn((value) => Promise.resolve(value as Merchant)),
    } as any;
    categories = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((value) => value as ProductCategory),
      save: jest.fn((value) => Promise.resolve(value as ProductCategory)),
    } as any;
    products = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn((value) => value as Product),
      save: jest.fn((value) => Promise.resolve(value as Product)),
    } as any;
    promotions = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn((value) => value as Promotion),
      save: jest.fn((value) => Promise.resolve(value as Promotion)),
    } as any;
    users = {
      findOne: jest.fn(),
      save: jest.fn((value) => Promise.resolve(value as User)),
    } as any;
    service = new MerchantsService(
      merchants as any,
      categories as any,
      products as any,
      promotions as any,
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

  it('features only live promotions from active merchants', async () => {
    promotions.find.mockResolvedValue([]);

    await service.featuredPromotions();

    expect(promotions.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isActive: true,
          merchant: { status: MerchantStatus.ACTIVE },
        }),
        relations: { merchant: true },
        take: 12,
      }),
    );
  });

  it('returns only active and available catalog content to customers', async () => {
    merchants.findOne.mockResolvedValue({
      id: 'merchant-1',
      status: MerchantStatus.ACTIVE,
    } as Merchant);
    categories.find.mockResolvedValue([]);

    await service.catalog('merchant-1');

    expect(categories.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          merchantId: 'merchant-1',
          isActive: true,
        }),
      }),
    );
    expect(products.find).not.toHaveBeenCalled();
  });

  it('creates a product only in a category belonging to the owned merchant', async () => {
    merchants.findOne.mockResolvedValue({
      id: 'merchant-1',
      ownerUserId: 'user-1',
    } as Merchant);
    categories.findOne.mockResolvedValue({
      id: 'category-1',
      merchantId: 'merchant-1',
    } as ProductCategory);

    const result = await service.createProduct('user-1', 'merchant-1', {
      categoryId: 'category-1',
      name: 'Riz au poulet',
      price: 2500,
    });

    expect(products.create).toHaveBeenCalledWith(
      expect.objectContaining({
        merchantId: 'merchant-1',
        categoryId: 'category-1',
        price: 2500,
      }),
    );
    expect(result.name).toBe('Riz au poulet');
  });

  it('groups saved products into their category when loading the owner catalog', async () => {
    merchants.findOne.mockResolvedValue({
      id: 'merchant-1',
      ownerUserId: 'user-1',
    } as Merchant);
    categories.find.mockResolvedValue([
      {
        id: 'category-1',
        merchantId: 'merchant-1',
        name: 'Repas',
      } as ProductCategory,
    ]);
    products.find.mockResolvedValue([
      {
        id: 'product-1',
        merchantId: 'merchant-1',
        categoryId: 'category-1',
        name: 'Poulet',
      } as Product,
    ]);

    const catalog = await service.ownerCatalog('user-1', 'merchant-1');

    expect(catalog.categories[0].products).toHaveLength(1);
    expect(catalog.categories[0].products[0].name).toBe('Poulet');
  });

  it('stores a category image only for an owned merchant category', async () => {
    merchants.findOne.mockResolvedValue({
      id: 'merchant-1',
      ownerUserId: 'user-1',
    } as Merchant);
    categories.findOne.mockResolvedValue({
      id: 'category-1',
      merchantId: 'merchant-1',
      name: 'Boissons',
    } as ProductCategory);

    const result = await service.saveCategoryImage(
      'user-1',
      'merchant-1',
      'category-1',
      'category.jpg',
    );

    expect(result.imageUrl).toBe('/merchant-logos/category.jpg');
    expect(categories.save).toHaveBeenCalledWith(
      expect.objectContaining({ imageUrl: '/merchant-logos/category.jpg' }),
    );
  });
});
