<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Scenario;

use NeNeConcierge\Scenario\Scenario;
use NeNeConcierge\Scenario\ScenarioNotFoundException;
use NeNeConcierge\Scenario\ScenarioRepositoryInterface;

final class InMemoryScenarioRepository implements ScenarioRepositoryInterface
{
    /** @var array<int, Scenario> */
    private array $store = [];

    private int $nextId = 1;

    public function findById(int $id, int $organizationId): ?Scenario
    {
        $scenario = $this->store[$id] ?? null;

        if ($scenario === null || $scenario->organizationId !== $organizationId) {
            return null;
        }

        return $scenario;
    }

    /** @return list<Scenario> */
    public function findAll(int $organizationId, int $limit, int $offset): array
    {
        $filtered = array_values(array_filter(
            $this->store,
            static fn (Scenario $s) => $s->organizationId === $organizationId,
        ));

        return array_slice(array_reverse($filtered), $offset, $limit);
    }

    public function count(int $organizationId): int
    {
        return count(array_filter(
            $this->store,
            static fn (Scenario $s) => $s->organizationId === $organizationId,
        ));
    }

    public function save(Scenario $scenario): int
    {
        $id = $this->nextId++;

        $this->store[$id] = new Scenario(
            name:           $scenario->name,
            status:         $scenario->status,
            organizationId: $scenario->organizationId,
            id:             $id,
            description:    $scenario->description,
            createdAt:      date('Y-m-d H:i:s'),
            updatedAt:      date('Y-m-d H:i:s'),
        );

        return $id;
    }

    public function update(Scenario $scenario): void
    {
        if ($scenario->id === null || !isset($this->store[$scenario->id])) {
            throw new ScenarioNotFoundException($scenario->id ?? 0);
        }

        $existing = $this->store[$scenario->id];

        $this->store[$scenario->id] = new Scenario(
            name:           $scenario->name,
            status:         $scenario->status,
            organizationId: $scenario->organizationId,
            id:             $scenario->id,
            description:    $scenario->description,
            createdAt:      $existing->createdAt,
            updatedAt:      date('Y-m-d H:i:s'),
        );
    }

    public function delete(int $id, int $organizationId): void
    {
        if (!isset($this->store[$id]) || $this->store[$id]->organizationId !== $organizationId) {
            throw new ScenarioNotFoundException($id);
        }

        unset($this->store[$id]);
    }
}
