<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

/**
 * Stores per-organization action adapter credentials.
 *
 * config_json holds the adapter-specific configuration (API keys, URLs, etc.).
 * In production this should be encrypted at rest; the application layer is
 * responsible for encryption/decryption before read/write.
 */
final class CreateActionCredentialsTable extends AbstractMigration
{
    public function change(): void
    {
        $this->table('action_credentials')
            ->addColumn('organization_id', 'integer', ['null' => false, 'signed' => false, 'default' => 0])
            ->addColumn('name', 'string', ['limit' => 128, 'null' => false])
            ->addColumn('adapter', 'string', ['limit' => 32, 'null' => false])
            ->addColumn('config_json', 'text', ['null' => false])
            ->addColumn('created_at', 'datetime', ['null' => false])
            ->addColumn('updated_at', 'datetime', ['null' => false])
            ->addIndex(['organization_id'])
            ->addIndex(['organization_id', 'adapter'])
            ->create();
    }
}
