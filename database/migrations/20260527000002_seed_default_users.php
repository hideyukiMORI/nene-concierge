<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class SeedDefaultUsers extends AbstractMigration
{
    public function up(): void
    {
        if (!$this->hasTable('users')) {
            return;
        }

        $now          = (new DateTimeImmutable())->format('Y-m-d H:i:s');
        $passwordHash = password_hash('nene1234', PASSWORD_DEFAULT);
        $pdo          = $this->getAdapter()->getConnection();

        $users = [
            [
                'email'         => 'superadmin@nene-concierge.local',
                'password_hash' => $passwordHash,
                'role'          => 'superadmin',
            ],
            [
                'email'         => 'owner@nene-concierge.local',
                'password_hash' => $passwordHash,
                'role'          => 'owner',
            ],
        ];

        foreach ($users as $user) {
            $statement = $pdo->prepare('SELECT id FROM users WHERE email = ?');
            $statement->execute([$user['email']]);

            if ($statement->fetch() !== false) {
                continue;
            }

            $this->table('users')->insert([
                'email'         => $user['email'],
                'password_hash' => $user['password_hash'],
                'role'          => $user['role'],
                'status'        => 'active',
                'created_at'    => $now,
                'updated_at'    => $now,
            ])->saveData();
        }
    }

    public function down(): void
    {
        if (!$this->hasTable('users')) {
            return;
        }

        $this->execute(
            "DELETE FROM users WHERE email IN ('superadmin@nene-concierge.local', 'owner@nene-concierge.local')",
        );
    }
}
