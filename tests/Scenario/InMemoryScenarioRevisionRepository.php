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

    /**
     * @return list<array<string, mixed>>
     */
    public function searchByOrganization(
        int $organizationId,
        ?int $scenarioId,
        ?int $userId,
        ?string $operation,
        ?string $query,
        ?int $dateFromUnix,
        ?int $dateToUnix,
        int $limit,
        int $offset,
    ): array {
        $filtered = $this->applyFilters(
            $organizationId,
            $scenarioId,
            $userId,
            $operation,
            $query,
            $dateFromUnix,
            $dateToUnix,
        );
        usort($filtered, static fn (ScenarioRevision $a, ScenarioRevision $b) => $b->id <=> $a->id);
        $page = array_slice($filtered, $offset, $limit);

        return array_map(
            static fn (ScenarioRevision $r): array => [
                'id'              => $r->id,
                'organization_id' => $r->organizationId,
                'scenario_id'     => $r->scenarioId,
                'scenario_name'   => null,
                'revision_no'     => $r->revisionNo,
                'user_id'         => $r->userId,
                'user_email'      => $r->userEmail,
                'operation'       => $r->operation,
                'name'            => $r->name,
                'description'     => $r->description,
                'status'          => $r->status,
                'node_count'      => $r->nodeCount,
                'edge_count'      => $r->edgeCount,
                'snapshot_json'   => $r->snapshotJson,
                'created_at'      => $r->createdAt,
            ],
            $page,
        );
    }

    public function countByOrganization(
        int $organizationId,
        ?int $scenarioId,
        ?int $userId,
        ?string $operation,
        ?string $query,
        ?int $dateFromUnix,
        ?int $dateToUnix,
    ): int {
        return count($this->applyFilters(
            $organizationId,
            $scenarioId,
            $userId,
            $operation,
            $query,
            $dateFromUnix,
            $dateToUnix,
        ));
    }

    /**
     * @return list<ScenarioRevision>
     */
    private function applyFilters(
        int $organizationId,
        ?int $scenarioId,
        ?int $userId,
        ?string $operation,
        ?string $query,
        ?int $dateFromUnix,
        ?int $dateToUnix,
    ): array {
        return array_values(array_filter($this->store, static function (ScenarioRevision $r) use (
            $organizationId,
            $scenarioId,
            $userId,
            $operation,
            $query,
            $dateFromUnix,
            $dateToUnix,
        ): bool {
            if ($r->organizationId !== $organizationId) {
                return false;
            }
            if ($scenarioId !== null && $r->scenarioId !== $scenarioId) {
                return false;
            }
            if ($userId !== null && $r->userId !== $userId) {
                return false;
            }
            if ($operation !== null && $operation !== '' && $r->operation !== $operation) {
                return false;
            }
            if ($query !== null && $query !== '') {
                $hay  = strtolower(($r->name ?? '') . ' ' . ($r->userEmail ?? ''));
                $q    = strtolower($query);
                if (!str_contains($hay, $q)) {
                    return false;
                }
            }
            if ($dateFromUnix !== null || $dateToUnix !== null) {
                $ts = $r->createdAt !== null ? strtotime($r->createdAt) : false;
                if ($ts === false) {
                    return false;
                }
                if ($dateFromUnix !== null && $ts < $dateFromUnix) {
                    return false;
                }
                if ($dateToUnix !== null && $ts >= $dateToUnix) {
                    return false;
                }
            }

            return true;
        }));
    }
}
