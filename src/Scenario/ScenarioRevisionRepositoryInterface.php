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

    /**
     * 横断検索 — 組織配下の全シナリオ履歴を検索する。
     *
     * @return list<array<string, mixed>>  scenario_name を含む結合済み配列
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
    ): array;

    public function countByOrganization(
        int $organizationId,
        ?int $scenarioId,
        ?int $userId,
        ?string $operation,
        ?string $query,
        ?int $dateFromUnix,
        ?int $dateToUnix,
    ): int;

    public function findById(int $id, int $organizationId): ?ScenarioRevision;

    /**
     * 直前 (revision_no - 1) の revision を返す。なければ null。
     */
    public function findPreviousFor(int $scenarioId, int $organizationId, int $revisionNo): ?ScenarioRevision;
}
