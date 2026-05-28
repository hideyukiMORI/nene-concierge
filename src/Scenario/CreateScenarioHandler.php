<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Validation\ValidationError;
use Nene2\Validation\ValidationException;
use NeNeConcierge\Auth\ActorContext;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

final readonly class CreateScenarioHandler implements RequestHandlerInterface
{
    public function __construct(
        private CreateScenarioUseCase $useCase,
        private JsonResponseFactory   $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $orgId = (int) $request->getAttribute('nene2.org.id', 0);
        $body  = JsonRequestBodyParser::parse($request);

        $errors = [];
        $name   = trim((string) ($body['name'] ?? ''));

        if ($name === '') {
            $errors[] = new ValidationError('name', 'Name is required.', 'required');
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $input = new CreateScenarioInput(
            name:        $name,
            description: isset($body['description']) ? (string) $body['description'] : null,
            nodes:       array_values((array) ($body['nodes'] ?? [])),
            edges:       array_values((array) ($body['edges'] ?? [])),
        );

        $scenarioId = $this->useCase->execute($input, $orgId, ActorContext::fromRequest($request));

        return $this->response->create(
            ['id' => $scenarioId],
            201,
            ['Location' => '/api/v1/scenarios/' . $scenarioId],
        );
    }
}
