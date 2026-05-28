<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

interface ScenarioRepositoryInterface
{
    public function findById(int $id, int $organizationId): ?Scenario;

    /** @return list<Scenario> */
    public function findAll(int $organizationId, int $limit, int $offset): array;

    public function count(int $organizationId): int;

    public function save(Scenario $scenario): int;

    /** @throws ScenarioNotFoundException */
    public function update(Scenario $scenario): void;

    /** @throws ScenarioNotFoundException */
    public function delete(int $id, int $organizationId): void;

    public function touchUpdatedBy(int $id, int $organizationId, ?int $userId): void;
}
