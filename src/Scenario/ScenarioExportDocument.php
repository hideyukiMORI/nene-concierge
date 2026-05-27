<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

/**
 * Portable export document for a scenario.
 *
 * Internal IDs (organization_id, scenario_id) are intentionally omitted
 * so the document can be imported into any organization.
 * Node positions are preserved for visual editor compatibility.
 */
final readonly class ScenarioExportDocument
{
    public const SCHEMA_VERSION = 1;

    /**
     * @param list<array<string, mixed>> $nodes  Serialized node definitions (no org/scenario IDs)
     * @param list<array<string, mixed>> $edges  Serialized edge definitions
     */
    public function __construct(
        public string  $name,
        public string  $exportedAt,
        public array   $nodes,
        public array   $edges,
        public ?string $description = null,
    ) {
    }
}
