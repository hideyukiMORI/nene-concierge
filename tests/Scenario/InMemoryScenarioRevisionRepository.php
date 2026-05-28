<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Scenario;

use NeNeConcierge\Scenario\ScenarioRevision;
use NeNeConcierge\Scenario\ScenarioRevisionRepositoryInterface;

final class InMemoryScenarioRevisionRepository implements ScenarioRevisionRepositoryInterface
{
    /** @var list<ScenarioRevision> */
    public array $store = [];

    private int $nextId = 1;

    public function append(ScenarioRevision $revision): int
    {
        $id = $this->nextId++;

        $this->store[] = new ScenarioRevision(
            scenarioId:     $revision->scenarioId,
            organizationId: $revision->organizationId,
            revisionNo:     $revision->revisionNo,
            userId:         $revision->userId,
            userEmail:      $revision->userEmail,
            operation:      $revision->operation,
            name:           $revision->name,
            description:    $revision->description,
            status:         $revision->status,
            nodeCount:      $revision->nodeCount,
            edgeCount:      $revision->edgeCount,
            snapshotJson:   $revision->snapshotJson,
            id:             $id,
            createdAt:      date('Y-m-d H:i:s'),
        );

        return $id;
    }

    public function nextRevisionNo(int $scenarioId, int $organizationId): int
    {
        $max = 0;
        foreach ($this->store as $r) {
            if ($r->scenarioId === $scenarioId && $r->organizationId === $organizationId) {
                $max = max($max, $r->revisionNo);
            }
        }

        return $max + 1;
    }

    /** @return list<ScenarioRevision> */
    public function listByScenario(int $scenarioId, int $organizationId, int $limit, int $offset): array
    {
        $filtered = array_values(array_filter(
            $this->store,
            static fn (ScenarioRevision $r) => $r->scenarioId === $scenarioId && $r->organizationId === $organizationId,
        ));
        usort($filtered, static fn (ScenarioRevision $a, ScenarioRevision $b) => $b->revisionNo <=> $a->revisionNo);

        return array_slice($filtered, $offset, $limit);
    }

    public function countByScenario(int $scenarioId, int $organizationId): int
    {
        return count(array_filter(
            $this->store,
            static fn (ScenarioRevision $r) => $r->scenarioId === $scenarioId && $r->organizationId === $organizationId,
        ));
    }
}
