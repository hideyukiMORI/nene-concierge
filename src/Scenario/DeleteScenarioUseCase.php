<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

final readonly class DeleteScenarioUseCase
{
    public function __construct(
        private ScenarioRepositoryInterface $scenarios,
    ) {
    }

    public function execute(int $scenarioId, int $organizationId): void
    {
        $this->scenarios->delete($scenarioId, $organizationId);
    }
}
