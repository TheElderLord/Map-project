import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { PlaceType } from '../entities/place-type.enum';

export class FindPlacesQueryDto {
  @IsOptional()
  @IsEnum(PlaceType)
  type?: PlaceType;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    return String(value).toLowerCase() === 'true';
  })
  @IsBoolean()
  upcomingOnly?: boolean;

  @IsOptional()
  @IsIn(['title', 'rating', 'createdAt', 'eventStartAt'])
  sortBy?: 'title' | 'rating' | 'createdAt' | 'eventStartAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
