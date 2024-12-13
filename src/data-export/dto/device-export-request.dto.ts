import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateIf,
  ValidateNested,
  ArrayMinSize,
  IsNumber,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum FileFormat {
  JSON = 'json',
  CSV = 'csv',
  XLSX = 'xlsx',
}

export enum DataOrganization {
  KEY = 'key',
  PARTITION = 'partition',
  FLAT = 'flat',
}

export enum TimeFormat {
  ISO = 'iso',
  HUMAN = 'human',
  RELATIVE = 'relative',
  UNIX = 'unix',
}

export enum NullValueHandling {
  EMPTY = 'empty',
  NULL = 'null',
  SKIP = 'skip',
  CUSTOM = 'custom',
}

export enum CsvDelimiter {
  COMMA = ',',
  SEMICOLON = ';',
  TAB = '\t',
  PIPE = '|',
}

export enum Compression {
  NONE = 'none',
  ZIP = 'zip',
}

export class KeyPartition {
  @ApiProperty({ description: 'Telemetry key name' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({
    description: 'Array of partition values as UNIX timestamps',
    example: [1625097600, 1625184000],
  })
  @IsArray()
  @ArrayMinSize(1)
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((v) => (typeof v === 'string' ? parseInt(v, 10) : v))
      : value,
  )
  @IsNumber({}, { each: true })
  @Min(0, {
    each: true,
    message: 'Each partition must be a valid UNIX timestamp',
  })
  partitions: number[];
}

export class DeviceExportRequestDto {
  @ApiProperty({ enum: FileFormat, description: 'Export file format' })
  @IsEnum(FileFormat)
  fileFormat: FileFormat;

  @ApiProperty({
    enum: DataOrganization,
    description: 'Data organization method',
  })
  @IsEnum(DataOrganization)
  dataOrganization: DataOrganization;

  @ApiProperty({ enum: TimeFormat, description: 'Timestamp format' })
  @IsEnum(TimeFormat)
  timeFormat: TimeFormat;

  @ApiProperty({
    enum: NullValueHandling,
    description: 'Null value handling method',
  })
  @IsEnum(NullValueHandling)
  nullValue: NullValueHandling;

  @ApiProperty({
    description: 'Custom value for null fields',
    required: false,
  })
  @ValidateIf((o) => o.nullValue === NullValueHandling.CUSTOM)
  @IsString()
  @IsNotEmpty()
  nullCustomValue?: string;

  @ApiProperty({
    enum: CsvDelimiter,
    description: 'CSV delimiter character',
    required: false,
  })
  @ValidateIf((o) => o.fileFormat === FileFormat.CSV)
  @IsEnum(CsvDelimiter)
  csvDelimiter?: CsvDelimiter;

  @ApiProperty({ enum: Compression, description: 'Compression method' })
  @IsEnum(Compression)
  compression: Compression;

  @ApiProperty({
    type: [KeyPartition],
    description: 'Selected keys and their partitions',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => KeyPartition)
  selectedData: KeyPartition[];
}
