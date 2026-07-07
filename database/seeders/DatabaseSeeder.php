<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Демо-аккаунты создаём напрямую (без фабрики/faker — недоступен в --no-dev).
        User::updateOrCreate(
            ['email' => 'demo@eppb.kz'],
            [
                'name' => 'Демо Предприниматель',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
                'is_admin' => false,
            ],
        );

        User::updateOrCreate(
            ['email' => 'admin@eppb.kz'],
            [
                'name' => 'Администратор портала',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
                'is_admin' => true,
            ],
        );

        $this->call([
            OrganizationSeeder::class,
            ReferenceSeeder::class,
            CatalogSeeder::class,
            ProjectSeeder::class,
            ContentSeeder::class,
        ]);
    }
}
