<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

/**
 * POST /api/v1/scenarios/import
 *
 * Accepts a scenario export document and creates a new draft scenario.
 * Node IDs are regenerated; the created scenario is always in draft status.
 *
 * Request body must be a valid ScenarioExportDocument JSON:
 * {
 *   "schema_version": 1,
 *   "scenario": {
 *     "name": "...",
 *     "description": "...",
 *     "nodes": [...],
 *     "edges": [...]
 *   }
 * }
 */
final readonly class ImportScenarioHandler implements RequestHandlerInterface
{
    public function __construct(
        private ImportScenarioUseCase $useCase,
        private JsonResponseFactory   $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $orgId  = (int) $request->getAttribute('nene2.org.id', 0);
        $body   = JsonRequestBodyParser::parse($request);
        $errors = [];

        $schemaVersion = (int) ($body['schema_version'] ?? 0);

        if ($schemaVersion !== ScenarioExportDocument::SCHEMA_VERSION) {
            $errors[] = new ValidationError(
                'schema_version',
                sprintf('schema_version must be %d.', ScenarioExportDocument::SCHEMA_VERSION),
                'invalid',
            );
        }

        /** @var array<string, mixed> $scenarioData */
        $scenarioData = isset($body['scenario']) && is_array($body['scenario']) ? $body['scenario'] : [];
        $name         = trim((string) ($scenarioData['name'] ?? ''));

        if ($name === '') {
            $errors[] = new ValidationError('scenario.name', 'scenario.name is required.', 'required');
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        /** @var list<array<string, mixed>> $nodes */
        $nodes = array_values((array) ($scenarioData['nodes'] ?? []));
        /** @var list<array<string, mixed>> $edges */
        $edges = array_values((array) ($scenarioData['edges'] ?? []));

        $description = isset($scenarioData['description']) && $scenarioData['description'] !== ''
            ? (string) $scenarioData['description']
            : null;

        $doc = new ScenarioExportDocument(
            name:        $name,
            exportedAt:  (string) ($body['exported_at'] ?? ''),
            nodes:       $nodes,
            edges:       $edges,
            description: $description,
        );

        $scenarioId = $this->useCase->execute($doc, $orgId);

        return $this->response->create(
            ['id' => $scenarioId],
            201,
            ['Location' => '/api/v1/scenarios/' . $scenarioId],
        );
    }
}
