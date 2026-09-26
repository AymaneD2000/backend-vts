import { HttpStatus } from '@nestjs/common';
import { ApplicationError, ApplicationErrorCode } from './application-error';

describe('ApplicationError', () => {
  it('preserves Nest fields and adds a stable code and details', () => {
    const error = new ApplicationError(
      HttpStatus.CONFLICT,
      ApplicationErrorCode.OUT_OF_STOCK,
      'Un produit est en rupture de stock.',
      { productIds: ['product-1'] },
    );

    expect(error.getResponse()).toEqual({
      statusCode: 409,
      code: 'OUT_OF_STOCK',
      message: 'Un produit est en rupture de stock.',
      productIds: ['product-1'],
    });
  });
});
