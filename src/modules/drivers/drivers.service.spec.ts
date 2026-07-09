import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  DriverProfile,
  KycStatus,
  VehicleType,
} from '../users/entities/driver-profile.entity';
import { Rating } from '../ratings/entities/rating.entity';
import { Ride } from '../rides/entities/ride.entity';
import { UsersService } from '../users/users.service';
import { DriverPresenceService } from './driver-presence.service';
import { DriversService } from './drivers.service';

function makeProfile(overrides: Partial<DriverProfile> = {}): DriverProfile {
  return {
    userId: 'u1',
    kycStatus: KycStatus.APPROVED,
    vehicleType: VehicleType.CAR,
    vehiclePlate: 'AB-123',
    vehicleMake: 'Toyota',
    vehicleModel: 'Corolla',
    vehicleColor: 'Blue',
    isAvailable: false,
    ...overrides,
  } as DriverProfile;
}

describe('DriversService', () => {
  let profiles: jest.Mocked<Pick<Repository<DriverProfile>, 'findOne' | 'save' | 'create' | 'update'>>;
  let rides: jest.Mocked<Pick<Repository<Ride>, 'createQueryBuilder'>>;
  let ratings: jest.Mocked<Pick<Repository<Rating>, 'createQueryBuilder'>>;
  let presence: jest.Mocked<Pick<DriverPresenceService, 'goOnline' | 'goOffline' | 'updateLocation'>>;
  let users: jest.Mocked<Pick<UsersService, 'findById' | 'addRole'>>;
  let events: jest.Mocked<Pick<EventEmitter2, 'emit'>>;
  let service: DriversService;

  beforeEach(() => {
    profiles = {
      findOne: jest.fn(),
      save: jest.fn((p) => Promise.resolve(p)),
      create: jest.fn((p) => p),
      update: jest.fn(),
    } as any;
    rides = { createQueryBuilder: jest.fn() } as any;
    ratings = { createQueryBuilder: jest.fn() } as any;
    presence = {
      goOnline: jest.fn(),
      goOffline: jest.fn(),
      updateLocation: jest.fn(),
    } as any;
    users = { findById: jest.fn(), addRole: jest.fn() } as any;
    events = { emit: jest.fn() } as any;
    service = new DriversService(
      profiles as any,
      rides as any,
      ratings as any,
      presence as any,
      users as any,
      events as any,
    );
  });

  describe('status', () => {
    it('reports ready + available for an approved, complete, available driver', async () => {
      profiles.findOne.mockResolvedValue(makeProfile({ isAvailable: true }));
      const result = await service.status('u1');
      expect(result.ready).toBe(true);
      expect(result.isAvailable).toBe(true);
      expect(result.canReceiveRides).toBe(true);
    });

    it('is not ready when KYC is not approved', async () => {
      profiles.findOne.mockResolvedValue(
        makeProfile({ kycStatus: KycStatus.PENDING, isAvailable: true }),
      );
      const result = await service.status('u1');
      expect(result.ready).toBe(false);
      expect(result.canReceiveRides).toBe(false);
    });

    it('is not ready with an incomplete vehicle profile', async () => {
      profiles.findOne.mockResolvedValue(makeProfile({ vehiclePlate: '' }));
      const result = await service.status('u1');
      expect(result.ready).toBe(false);
    });

    it('defaults to PENDING when no profile exists', async () => {
      profiles.findOne.mockResolvedValue(null);
      const result = await service.status('u1');
      expect(result.kycStatus).toBe(KycStatus.PENDING);
      expect(result.ready).toBe(false);
    });
  });

  describe('goOnline', () => {
    const pos = { lat: 12.6, lng: -8.0 };

    it('rejects a driver whose KYC is not approved', async () => {
      profiles.findOne.mockResolvedValue(
        makeProfile({ kycStatus: KycStatus.SUBMITTED }),
      );
      await expect(service.goOnline('u1', pos)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(presence.goOnline).not.toHaveBeenCalled();
    });

    it('rejects a driver with an incomplete vehicle profile', async () => {
      profiles.findOne.mockResolvedValue(makeProfile({ vehicleModel: '' }));
      await expect(service.goOnline('u1', pos)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('goes online, backfills the driver role, and emits DRIVER_ONLINE', async () => {
      profiles.findOne.mockResolvedValue(makeProfile());
      users.findById.mockResolvedValue({ id: 'u1' } as any);

      await service.goOnline('u1', pos);

      expect(presence.goOnline).toHaveBeenCalledWith(
        'u1',
        VehicleType.CAR,
        pos,
      );
      expect(users.addRole).toHaveBeenCalled();
      expect(events.emit).toHaveBeenCalled();
    });
  });

  describe('updateLocation', () => {
    it('throws when the driver is offline', async () => {
      presence.updateLocation.mockResolvedValue(false);
      await expect(
        service.updateLocation('u1', { lat: 12.6, lng: -8.0 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
