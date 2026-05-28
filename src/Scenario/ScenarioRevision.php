<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

final readonly class ScenarioRevision
{
    public function __construct(
        public int     $scenarioId,
        public int     $organizationId,
        public int     $revisionNo,
        public ?int    $userId,
        public ?string $userEmail,
        public string  $operation,
        public ?string $name,
        public ?string $description,
        public ?string $status,
        public int     $nodeCount,
        public int     $edgeCount,
        public ?string $snapshotJson,
        public ?int    $id        = null,
        public ?string $createdAt = null,
    ) {
    }
}
