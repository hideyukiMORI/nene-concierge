<?php

declare(strict_types=1);

namespace NeNeConcierge\Action;

interface ActionCredentialRepositoryInterface
{
    public function findById(int $id, int $organizationId): ?ActionCredential;

    /** @return list<ActionCredential> */
    public function findAll(int $organizationId): array;

    public function save(ActionCredential $credential): int;

    /** @throws ActionCredentialNotFoundException */
    public function update(ActionCredential $credential): void;

    /** @throws ActionCredentialNotFoundException */
    public function delete(int $id, int $organizationId): void;
}
