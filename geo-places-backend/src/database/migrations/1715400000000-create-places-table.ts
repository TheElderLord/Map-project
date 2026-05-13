import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreatePlacesTable1715400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'places',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: [
              'EVENT',
              'RESTAURANT',
              'CAFE',
              'PARK',
              'SHOP',
              'HOTEL',
              'UNIVERSITY',
              'HOSPITAL',
              'OTHER',
            ],
            default: "'OTHER'",
          },
          {
            name: 'address',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'rating',
            type: 'double precision',
            default: 0,
          },
          {
            name: 'latitude',
            type: 'double precision',
          },
          {
            name: 'longitude',
            type: 'double precision',
          },
          {
            name: 'event_start_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'ticket_price',
            type: 'double precision',
            isNullable: true,
          },
          {
            name: 'event_details',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'ticket_url',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'places',
      new TableIndex({
        name: 'IDX_places_type',
        columnNames: ['type'],
      }),
    );

    await queryRunner.createIndex(
      'places',
      new TableIndex({
        name: 'IDX_places_rating',
        columnNames: ['rating'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('places', 'IDX_places_rating');
    await queryRunner.dropIndex('places', 'IDX_places_type');
    await queryRunner.dropTable('places');
  }
}
