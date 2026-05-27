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
     * Execute the action and return any output variables to merge into the session.
     *
     * Most adapters return an empty array (fire-and-forget).
     * Adapters that produce data (e.g. QR code) return named variables
     * that the engine will write into the session's variable store.
     *
     * @param  array<string, mixed>  $params
     * @return array<string, string> Output variables (empty for most adapters)
     */
    public function execute(array $params, int $organizationId): array;
}
