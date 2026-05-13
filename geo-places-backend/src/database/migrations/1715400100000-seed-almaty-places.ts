import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedAlmatyPlaces1715400100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into('places')
      .values([
        {
          title: 'Almaty Jazz Night',
          description: 'Live evening performance with city artists and rooftop lights.',
          type: 'EVENT',
          address: 'Abay Ave, Almaty',
          rating: 5,
          latitude: 43.2382,
          longitude: 76.9451,
          event_start_at: '2026-06-20 19:30:00',
          ticket_price: 12000,
          event_details:
            'Live jazz set, welcome drink, and terrace seating with skyline views.',
          ticket_url: 'https://example.com/almaty-jazz-night',
        },
        {
          title: 'Kok Tobe Park',
          description:
            'Hilltop park with city views and an evening atmosphere.',
          type: 'PARK',
          address: 'Kok Tobe, Almaty',
          rating: 5,
          latitude: 43.2339,
          longitude: 76.9768,
        },
        {
          title: 'Green Bazaar',
          description: 'Popular market for food, spices, and local products.',
          type: 'SHOP',
          address: 'Zhibek Zholy Ave, Almaty',
          rating: 4,
          latitude: 43.2621,
          longitude: 76.9458,
        },
        {
          title: 'Panfilov Park',
          description: 'Historic city park near Zenkov Cathedral.',
          type: 'PARK',
          address: 'Panfilov Park, Almaty',
          rating: 5,
          latitude: 43.2586,
          longitude: 76.9547,
        },
        {
          title: 'Coffee Boom Dostyk',
          description: 'Cafe spot for casual meetings in the city center.',
          type: 'CAFE',
          address: 'Dostyk Ave, Almaty',
          rating: 4,
          latitude: 43.2389,
          longitude: 76.8897,
        },
        {
          title: 'MEGA Alma-Ata',
          description: 'Large shopping center with dining and retail.',
          type: 'SHOP',
          address: 'Rozybakiev St, Almaty',
          rating: 4,
          latitude: 43.2015,
          longitude: 76.8924,
        },
        {
          title: 'Abay Opera House',
          description:
            'Classic cultural landmark for performances and architecture.',
          type: 'OTHER',
          address: 'Kabanbay Batyr St, Almaty',
          rating: 5,
          latitude: 43.2567,
          longitude: 76.9453,
        },
      ])
      .execute();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager
      .createQueryBuilder()
      .delete()
      .from('places')
      .where('title IN (:...titles)', {
        titles: [
          'Almaty Jazz Night',
          'Kok Tobe Park',
          'Green Bazaar',
          'Panfilov Park',
          'Coffee Boom Dostyk',
          'MEGA Alma-Ata',
          'Abay Opera House',
        ],
      })
      .execute();
  }
}
