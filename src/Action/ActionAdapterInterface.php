<?php

declare(strict_types=1);

namespace NeNeConcierge\Action;

/**
 * Executes a single action (email send, Slack post, HTTP call, etc.)
 * for the given node data and organization.
 *
 * Implementations must be stateless; all configuration comes from $params
 * (merged from node data_json and resolved credentials) and $organizationId.
 *
 * @throws ActionException on execution failure
 */
interface ActionAdapterInterface
{
    public function adapterType(): string;

    /**
     * @param array<string, mixed> $params
     */
    public function execute(array $params, int $organizationId): void;
}
