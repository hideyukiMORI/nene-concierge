<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

use NeNeConcierge\Auth\ActorContext;

final readonly class DeleteScenarioUseCase
{
    public function __construct(
        private ScenarioRepositoryInterface $scenarios,
        private ScenarioRevisionRecorder    $revisions,
    ) {
    }

    public function execute(int $scenarioId, int $organizationId, ActorContext $actor): void
    {
        $scenario = $this->scenarios->findById($scenarioId, $organizationId);
        if ($scenario === null) {
            throw new ScenarioNotFoundException($scenarioId);
        }

        // Capture revision BEFORE the delete cascades (snapshot of last known state).
        $this->revisions->record($scenario, 'delete', $actor);

        $this->scenarios->delete($scenarioId, $organizationId);
    }
}
