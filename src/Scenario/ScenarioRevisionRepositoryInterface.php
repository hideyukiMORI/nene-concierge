<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

interface ScenarioRevisionRepositoryInterface
{
    public function append(ScenarioRevision $revision): int;

    public function nextRevisionNo(int $scenarioId, int $organizationId): int;

    /** @return list<ScenarioRevision> */
    public function listByScenario(int $scenarioId, int $organizationId, int $limit, int $offset): array;

    public function countByScenario(int $scenarioId, int $organizationId): int;
}
