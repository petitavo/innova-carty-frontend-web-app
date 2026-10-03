import { Injectable } from '@angular/core';
import { BaseApiService } from '../../shared/infrastructure/base-api.service';
import { Product } from '../domain/model/product.entity';

@Injectable({ providedIn: 'root' })
export class ProductsApi extends BaseApiService<Product> {
  protected readonly resource = 'products';
}
