<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

/**
 * Imports a portable scenario export document and creates a new draft scenario.
 *
 * Node IDs are regenerated as UUID v4 strings so the imported scenario is
 * fully independent of the source. Edge references are remapped accordingly.
 *
 * The new scenario is always created in `draft` status regardless of the
 * original scenario's status.
 */
final readonly class ImportScenarioUseCase
{
    public function __construct(
        private ScenarioRepositoryInterface     $scenarios,
        private ScenarioNodeRepositoryInterface $nodes,
        private ScenarioEdgeRepositoryInterface $edges,
    ) {
    }

    public function execute(ScenarioExportDocument $doc, int $organizationId): int
    {
        $scenario = new Scenario(
            name:           $doc->name,
            status:         ScenarioStatus::Draft,
            organizationId: $organizationId,
            description:    $doc->description,
        );

        $scenarioId = $this->scenarios->save($scenario);

        if ($doc->nodes === []) {
            return $scenarioId;
        }

        // Remap old node IDs → new UUID v4 values
        /** @var array<string, string> $idMap  old_node_id => new_node_id */
        $idMap = [];

        foreach ($doc->nodes as $n) {
            $oldId        = (string) $n['node_id'];
            $idMap[$oldId] = $this->generateUuid();
        }

        $nodeEntities = [];

        foreach ($doc->nodes as $n) {
            $oldId = (string) $n['node_id'];
            $nodeEntities[] = new ScenarioNode(
                nodeId:         $idMap[$oldId],
                scenarioId:     $scenarioId,
                organizationId: $organizationId,
                type:           ScenarioNodeType::from((string) $n['type']),
                label:          (string) ($n['label'] ?? ''),
                data:           (array) ($n['data'] ?? []),
                positionX:      (float) ($n['position_x'] ?? 0.0),
                positionY:      (float) ($n['position_y'] ?? 0.0),
            );
        }

        $this->nodes->replaceAll($scenarioId, $organizationId, $nodeEntities);

        if ($doc->edges !== []) {
            $edgeEntities = [];

            foreach ($doc->edges as $e) {
                $oldSource = (string) $e['source_node_id'];
                $oldTarget = (string) $e['target_node_id'];

                // Skip edges that reference unknown nodes (defensive)
                if (!isset($idMap[$oldSource], $idMap[$oldTarget])) {
                    continue;
                }

                $edgeEntities[] = new ScenarioEdge(
                    scenarioId:     $scenarioId,
                    organizationId: $organizationId,
                    sourceNodeId:   $idMap[$oldSource],
                    targetNodeId:   $idMap[$oldTarget],
                    label:          isset($e['label']) ? (string) $e['label'] : null,
                );
            }

            if ($edgeEntities !== []) {
                $this->edges->replaceAll($scenarioId, $organizationId, $edgeEntities);
            }
        }

        return $scenarioId;
    }

    /**
     * Generate a UUID v4 string without external dependencies.
     */
    private function generateUuid(): string
    {
        $bytes    = random_bytes(16);
        $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
        $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);

        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
    }
}
