<?php

declare(strict_types=1);

namespace NeNeConcierge\Tests\Scenario;

use NeNeConcierge\Scenario\ExportScenarioUseCase;
use NeNeConcierge\Scenario\ImportScenarioUseCase;
use NeNeConcierge\Scenario\Scenario;
use NeNeConcierge\Scenario\ScenarioEdge;
use NeNeConcierge\Scenario\ScenarioExportDocument;
use NeNeConcierge\Scenario\ScenarioNode;
use NeNeConcierge\Scenario\ScenarioNodeType;
use NeNeConcierge\Scenario\ScenarioNotFoundException;
use NeNeConcierge\Scenario\ScenarioStatus;
use NeNeConcierge\Tests\Support\FixedClock;
use PHPUnit\Framework\TestCase;

final class ImportExportTest extends TestCase
{
    private const int ORG_A = 1;
    private const int ORG_B = 2;

    private InMemoryScenarioRepository     $scenarioRepo;
    private InMemoryScenarioNodeRepository $nodeRepo;
    private InMemoryScenarioEdgeRepository $edgeRepo;

    private ExportScenarioUseCase $exportUseCase;
    private ImportScenarioUseCase $importUseCase;

    protected function setUp(): void
    {
        $this->scenarioRepo  = new InMemoryScenarioRepository();
        $this->nodeRepo      = new InMemoryScenarioNodeRepository();
        $this->edgeRepo      = new InMemoryScenarioEdgeRepository();

        $this->exportUseCase = new ExportScenarioUseCase(
            $this->scenarioRepo,
            $this->nodeRepo,
            $this->edgeRepo,
            new FixedClock(),
        );

        $this->importUseCase = new ImportScenarioUseCase(
            $this->scenarioRepo,
            $this->nodeRepo,
            $this->edgeRepo,
        );
    }

    /** ------------------------------------------------------------------ */

    public function testExportThrowsWhenScenarioNotFound(): void
    {
        $this->expectException(ScenarioNotFoundException::class);

        $this->exportUseCase->execute(999, self::ORG_A);
    }

    public function testExportDocumentContainsScenarioMetadata(): void
    {
        $scenarioId = $this->seedScenario('Summer Campaign', self::ORG_A, 'A warm season scenario');

        $doc = $this->exportUseCase->execute($scenarioId, self::ORG_A);

        self::assertSame('Summer Campaign', $doc->name);
        self::assertSame('A warm season scenario', $doc->description);
        self::assertSame(ScenarioExportDocument::SCHEMA_VERSION, 1);
        self::assertNotEmpty($doc->exportedAt);
    }

    public function testExportDocumentContainsNodes(): void
    {
        $scenarioId = $this->seedScenario('My Scenario', self::ORG_A);
        $this->seedNodes($scenarioId, self::ORG_A, [
            ['node_id' => 'node-a', 'type' => ScenarioNodeType::Message, 'label' => 'Hello'],
            ['node_id' => 'node-b', 'type' => ScenarioNodeType::End,     'label' => 'Done'],
        ]);

        $doc = $this->exportUseCase->execute($scenarioId, self::ORG_A);

        self::assertCount(2, $doc->nodes);
        self::assertSame('node-a', $doc->nodes[0]['node_id']);
        self::assertSame('message', $doc->nodes[0]['type']);
        self::assertSame('Hello', $doc->nodes[0]['label']);
        self::assertSame('node-b', $doc->nodes[1]['node_id']);
        self::assertSame('end', $doc->nodes[1]['type']);
    }

    public function testExportDocumentContainsEdges(): void
    {
        $scenarioId = $this->seedScenario('My Scenario', self::ORG_A);
        $this->seedNodes($scenarioId, self::ORG_A, [
            ['node_id' => 'node-a', 'type' => ScenarioNodeType::Message, 'label' => 'Hello'],
            ['node_id' => 'node-b', 'type' => ScenarioNodeType::End,     'label' => 'Done'],
        ]);
        $this->seedEdge($scenarioId, self::ORG_A, 'node-a', 'node-b', 'Continue');

        $doc = $this->exportUseCase->execute($scenarioId, self::ORG_A);

        self::assertCount(1, $doc->edges);
        self::assertSame('node-a', $doc->edges[0]['source_node_id']);
        self::assertSame('node-b', $doc->edges[0]['target_node_id']);
        self::assertSame('Continue', $doc->edges[0]['label']);
    }

    public function testExportDoesNotIncludeOrgOrScenarioIds(): void
    {
        $scenarioId = $this->seedScenario('My Scenario', self::ORG_A);
        $this->seedNodes($scenarioId, self::ORG_A, [
            ['node_id' => 'node-a', 'type' => ScenarioNodeType::Message, 'label' => 'Hi'],
        ]);

        $doc = $this->exportUseCase->execute($scenarioId, self::ORG_A);

        foreach ($doc->nodes as $node) {
            self::assertArrayNotHasKey('scenario_id', $node);
            self::assertArrayNotHasKey('organization_id', $node);
        }
    }

    /** ------------------------------------------------------------------ */

    public function testImportCreatesScenarioInDraftStatus(): void
    {
        $doc = new ScenarioExportDocument(
            name:       'Imported Scenario',
            exportedAt: '2026-01-01T00:00:00+00:00',
            nodes:      [],
            edges:      [],
        );

        $newId = $this->importUseCase->execute($doc, self::ORG_B);

        $imported = $this->scenarioRepo->findById($newId, self::ORG_B);
        self::assertNotNull($imported);
        self::assertSame('Imported Scenario', $imported->name);
        self::assertSame(ScenarioStatus::Draft, $imported->status);
        self::assertSame(self::ORG_B, $imported->organizationId);
    }

    public function testImportPreservesDescription(): void
    {
        $doc = new ScenarioExportDocument(
            name:        'Imported',
            exportedAt:  '2026-01-01T00:00:00+00:00',
            nodes:       [],
            edges:       [],
            description: 'Imported description',
        );

        $newId    = $this->importUseCase->execute($doc, self::ORG_B);
        $imported = $this->scenarioRepo->findById($newId, self::ORG_B);

        self::assertNotNull($imported);
        self::assertSame('Imported description', $imported->description);
    }

    public function testImportWithNoNodesReturnsId(): void
    {
        $doc = new ScenarioExportDocument(
            name:       'Empty',
            exportedAt: '',
            nodes:      [],
            edges:      [],
        );

        $newId = $this->importUseCase->execute($doc, self::ORG_B);

        self::assertGreaterThan(0, $newId);
        $nodes = $this->nodeRepo->findByScenario($newId, self::ORG_B);
        self::assertCount(0, $nodes);
    }

    public function testImportRegeneratesNodeIds(): void
    {
        $doc = new ScenarioExportDocument(
            name:       'Has Nodes',
            exportedAt: '',
            nodes:      [
                ['node_id' => 'old-node-a', 'type' => 'message', 'label' => 'Hello', 'data' => [], 'position_x' => 0.0, 'position_y' => 0.0],
                ['node_id' => 'old-node-b', 'type' => 'end',     'label' => 'Bye',   'data' => [], 'position_x' => 1.0, 'position_y' => 2.0],
            ],
            edges:      [],
        );

        $newId = $this->importUseCase->execute($doc, self::ORG_B);
        $nodes = $this->nodeRepo->findByScenario($newId, self::ORG_B);

        self::assertCount(2, $nodes);

        $nodeIds = array_map(static fn (ScenarioNode $n) => $n->nodeId, $nodes);

        // New IDs must not match old IDs
        self::assertNotContains('old-node-a', $nodeIds);
        self::assertNotContains('old-node-b', $nodeIds);

        // New IDs must look like UUID v4
        foreach ($nodeIds as $id) {
            self::assertMatchesRegularExpression(
                '/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i',
                $id,
                "Node ID '{$id}' is not a valid UUID v4.",
            );
        }
    }

    public function testImportRemapsEdgeReferences(): void
    {
        $doc = new ScenarioExportDocument(
            name:       'Has Edges',
            exportedAt: '',
            nodes:      [
                ['node_id' => 'old-a', 'type' => 'message', 'label' => 'Q', 'data' => [], 'position_x' => 0.0, 'position_y' => 0.0],
                ['node_id' => 'old-b', 'type' => 'end',     'label' => 'E', 'data' => [], 'position_x' => 0.0, 'position_y' => 0.0],
            ],
            edges:      [
                ['source_node_id' => 'old-a', 'target_node_id' => 'old-b', 'label' => 'yes'],
            ],
        );

        $newId = $this->importUseCase->execute($doc, self::ORG_B);
        $nodes = $this->nodeRepo->findByScenario($newId, self::ORG_B);
        $edges = $this->edgeRepo->findByScenario($newId, self::ORG_B);

        self::assertCount(1, $edges);

        // Edge source/target must now reference one of the newly generated node IDs
        $nodeIds = array_map(static fn (ScenarioNode $n) => $n->nodeId, $nodes);

        self::assertContains($edges[0]->sourceNodeId, $nodeIds);
        self::assertContains($edges[0]->targetNodeId, $nodeIds);
        self::assertNotSame($edges[0]->sourceNodeId, $edges[0]->targetNodeId);

        // Old IDs must not appear in edges
        self::assertNotSame('old-a', $edges[0]->sourceNodeId);
        self::assertNotSame('old-b', $edges[0]->targetNodeId);
    }

    public function testImportSkipsEdgesWithUnknownNodeReferences(): void
    {
        $doc = new ScenarioExportDocument(
            name:       'Dangling Edge',
            exportedAt: '',
            nodes:      [
                ['node_id' => 'known', 'type' => 'message', 'label' => 'Hi', 'data' => [], 'position_x' => 0.0, 'position_y' => 0.0],
            ],
            edges:      [
                // references a node_id that was never in the nodes list
                ['source_node_id' => 'known', 'target_node_id' => 'ghost', 'label' => null],
            ],
        );

        $newId = $this->importUseCase->execute($doc, self::ORG_B);
        $edges = $this->edgeRepo->findByScenario($newId, self::ORG_B);

        // Dangling edge silently dropped
        self::assertCount(0, $edges);
    }

    /** ------------------------------------------------------------------ */

    /**
     * Full round-trip: export from Org A → import into Org B.
     * Nodes/edges must be preserved (structure), IDs regenerated.
     */
    public function testRoundTripExportThenImport(): void
    {
        // ── Seed source scenario in Org A ─────────────────────────────
        $sourceId = $this->seedScenario('Original', self::ORG_A, 'Original description');
        $this->seedNodes($sourceId, self::ORG_A, [
            ['node_id' => 'src-1', 'type' => ScenarioNodeType::Message,   'label' => 'Welcome'],
            ['node_id' => 'src-2', 'type' => ScenarioNodeType::Condition,  'label' => 'Check age'],
            ['node_id' => 'src-3', 'type' => ScenarioNodeType::End,        'label' => 'Done'],
        ]);
        $this->seedEdge($sourceId, self::ORG_A, 'src-1', 'src-2', null);
        $this->seedEdge($sourceId, self::ORG_A, 'src-2', 'src-3', 'match');

        // ── Export ────────────────────────────────────────────────────
        $doc = $this->exportUseCase->execute($sourceId, self::ORG_A);

        self::assertSame('Original', $doc->name);
        self::assertSame('Original description', $doc->description);
        self::assertCount(3, $doc->nodes);
        self::assertCount(2, $doc->edges);

        // ── Import into Org B ─────────────────────────────────────────
        $importedId = $this->importUseCase->execute($doc, self::ORG_B);

        // New scenario is in Org B, not Org A
        self::assertNull($this->scenarioRepo->findById($importedId, self::ORG_A));
        $imported = $this->scenarioRepo->findById($importedId, self::ORG_B);
        self::assertNotNull($imported);
        self::assertSame('Original', $imported->name);
        self::assertSame('Original description', $imported->description);
        self::assertSame(ScenarioStatus::Draft, $imported->status);

        $importedNodes = $this->nodeRepo->findByScenario($importedId, self::ORG_B);
        $importedEdges = $this->edgeRepo->findByScenario($importedId, self::ORG_B);

        self::assertCount(3, $importedNodes);
        self::assertCount(2, $importedEdges);

        // ── Node structure preserved, IDs regenerated ─────────────────
        $labels = array_map(static fn (ScenarioNode $n) => $n->label, $importedNodes);
        sort($labels);
        self::assertSame(['Check age', 'Done', 'Welcome'], $labels);

        $types = array_map(static fn (ScenarioNode $n) => $n->type, $importedNodes);
        $typeValues = array_map(static fn (ScenarioNodeType $t) => $t->value, $types);
        sort($typeValues);
        self::assertSame(['condition', 'end', 'message'], $typeValues);

        $newNodeIds = array_map(static fn (ScenarioNode $n) => $n->nodeId, $importedNodes);
        self::assertNotContains('src-1', $newNodeIds);
        self::assertNotContains('src-2', $newNodeIds);
        self::assertNotContains('src-3', $newNodeIds);

        // ── Edge referential integrity ─────────────────────────────────
        foreach ($importedEdges as $edge) {
            self::assertContains($edge->sourceNodeId, $newNodeIds);
            self::assertContains($edge->targetNodeId, $newNodeIds);
        }
    }

    /** ------------------------------------------------------------------ */

    private function seedScenario(string $name, int $orgId, ?string $description = null): int
    {
        return $this->scenarioRepo->save(new Scenario(
            name:           $name,
            status:         ScenarioStatus::Draft,
            organizationId: $orgId,
            description:    $description,
        ));
    }

    /**
     * @param list<array{node_id: string, type: ScenarioNodeType, label: string}> $nodeData
     */
    private function seedNodes(int $scenarioId, int $orgId, array $nodeData): void
    {
        $nodes = [];

        foreach ($nodeData as $n) {
            $nodes[] = new ScenarioNode(
                nodeId:         $n['node_id'],
                scenarioId:     $scenarioId,
                organizationId: $orgId,
                type:           $n['type'],
                label:          $n['label'],
            );
        }

        $this->nodeRepo->replaceAll($scenarioId, $orgId, $nodes);
    }

    private function seedEdge(int $scenarioId, int $orgId, string $source, string $target, ?string $label): void
    {
        $existing = $this->edgeRepo->findByScenario($scenarioId, $orgId);
        $existing[] = new ScenarioEdge(
            scenarioId:     $scenarioId,
            organizationId: $orgId,
            sourceNodeId:   $source,
            targetNodeId:   $target,
            label:          $label,
        );
        $this->edgeRepo->replaceAll($scenarioId, $orgId, $existing);
    }
}
