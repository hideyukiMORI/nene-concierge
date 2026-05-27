<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

final readonly class UpdateScenarioInput
{
    /**
     * @param list<array<string, mixed>>|null $nodes
     * @param list<array<string, mixed>>|null $edges
     */
    public function __construct(
        public int $scenarioId,
        public ?string $name = null,
        public ?string $description = null,
        public ?ScenarioStatus $status = null,
        public ?array $nodes = null,
        public ?array $edges = null,
    ) {
    }
}
