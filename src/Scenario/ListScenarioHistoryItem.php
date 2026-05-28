<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

final readonly class ListScenarioHistoryItem
{
    public function __construct(
        public int     $id,
        public int     $revisionNo,
        public ?int    $userId,
        public ?string $userEmail,
        public string  $operation,
        public ?string $name,
        public ?string $status,
        public int     $nodeCount,
        public int     $edgeCount,
        public ?string $createdAt,
    ) {
    }
}
