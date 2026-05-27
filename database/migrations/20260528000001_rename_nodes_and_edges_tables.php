<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

/**
 * Rename generic `nodes` and `edges` tables to `scenario_nodes` and `scenario_edges`
 * to match the names expected by PdoScenarioNodeRepository and PdoScenarioEdgeRepository.
 */
final class RenameNodesAndEdgesTables extends AbstractMigration
{
    public function up(): void
    {
        $this->table('nodes')->rename('scenario_nodes')->update();
        $this->table('edges')->rename('scenario_edges')->update();
    }

    public function down(): void
    {
        $this->table('scenario_nodes')->rename('nodes')->update();
        $this->table('scenario_edges')->rename('edges')->update();
    }
}
