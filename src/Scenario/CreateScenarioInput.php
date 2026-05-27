<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

final readonly class CreateScenarioInput
{
    /**
     * @param list<array<string, mixed>> $nodes
     * @param list<array<string, mixed>> $edges
     */
    public function __construct(
        public string $name,
        public ?string $description = null,
        public array $nodes = [],
        public array $edges = [],
    ) {
    }
}
