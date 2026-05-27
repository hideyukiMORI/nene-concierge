<?php

declare(strict_types=1);

namespace NeNeConcierge\Action;

/**
 * Dispatches an action node to the appropriate adapter, writes the action log,
 * and surfaces success/failure to the Engine.
 *
 * The adapter is selected by matching node data's 'adapter' key to
 * ActionAdapterInterface::adapterType(). If no adapter matches, the action
 * is logged as a failure and an ActionException is thrown.
 */
final readonly class ActionDispatcher
{
    /**
     * @param list<ActionAdapterInterface> $adapters
     */
    public function __construct(
        private array                    $adapters,
        private ActionLogRepositoryInterface $logs,
    ) {
    }

    /**
     * @param array<string, mixed> $nodeData   The action node's data_json
     *
     * @return array<string, string> Output variables returned by the adapter (empty for most)
     *
     * @throws ActionException
     */
    public function dispatch(
        array  $nodeData,
        int    $organizationId,
        string $sessionId,
        int    $scenarioId,
        string $nodeId,
    ): array {
        $adapterType = (string) ($nodeData['adapter'] ?? '');

        /** @var array<string, mixed> $params */
        $params  = (array) ($nodeData['params'] ?? []);
        $now     = date('Y-m-d H:i:s');
        $adapter = $this->findAdapter($adapterType);

        if ($adapter === null) {
            $error = "No adapter registered for type '{$adapterType}'.";
            $this->logs->append(new ActionLog(
                organizationId: $organizationId,
                sessionId:      $sessionId,
                scenarioId:     $scenarioId,
                nodeId:         $nodeId,
                adapter:        $adapterType !== '' ? $adapterType : 'unknown',
                status:         'failure',
                executedAt:     $now,
                errorMessage:   $error,
            ));

            throw new ActionException($error);
        }

        try {
            $outputVars = $adapter->execute($params, $organizationId);

            $this->logs->append(new ActionLog(
                organizationId: $organizationId,
                sessionId:      $sessionId,
                scenarioId:     $scenarioId,
                nodeId:         $nodeId,
                adapter:        $adapterType,
                status:         'success',
                executedAt:     $now,
            ));

            return $outputVars;
        } catch (ActionException $e) {
            $this->logs->append(new ActionLog(
                organizationId: $organizationId,
                sessionId:      $sessionId,
                scenarioId:     $scenarioId,
                nodeId:         $nodeId,
                adapter:        $adapterType,
                status:         'failure',
                executedAt:     $now,
                errorMessage:   $e->getMessage(),
            ));

            throw $e;
        }
    }

    private function findAdapter(string $type): ?ActionAdapterInterface
    {
        foreach ($this->adapters as $adapter) {
            if ($adapter->adapterType() === $type) {
                return $adapter;
            }
        }

        return null;
    }
}
