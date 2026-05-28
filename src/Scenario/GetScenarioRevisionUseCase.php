<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

final readonly class GetScenarioRevisionUseCase
{
    public function __construct(
        private ScenarioRevisionRepositoryInterface $revisions,
    ) {
    }

    public function execute(int $id, int $organizationId): GetScenarioRevisionResult
    {
        $revision = $this->revisions->findById($id, $organizationId);
        if ($revision === null) {
            throw new ScenarioRevisionNotFoundException($id);
        }

        $previous = $this->revisions->findPreviousFor(
            $revision->scenarioId,
            $organizationId,
            $revision->revisionNo,
        );

        return new GetScenarioRevisionResult($revision, $previous);
    }
}
