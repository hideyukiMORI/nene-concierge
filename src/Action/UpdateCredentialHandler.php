<?php

declare(strict_types=1);

namespace NeNeConcierge\Action;

use Nene2\Http\JsonRequestBodyParser;
use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

final readonly class UpdateCredentialHandler implements RequestHandlerInterface
{
    public function __construct(
        private ActionCredentialRepositoryInterface $credentials,
        private JsonResponseFactory                 $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $orgId = (int) $request->getAttribute('nene2.org.id', 0);
        $id    = (int) Router::param($request, 'id');
        $body  = JsonRequestBodyParser::parse($request);

        $existing = $this->credentials->findById($id, $orgId);

        if ($existing === null) {
            throw new ActionCredentialNotFoundException($id);
        }

        /** @var array<string, mixed> $config */
        $config = isset($body['config']) ? (array) $body['config'] : $existing->config;

        $updated = new ActionCredential(
            organizationId: $orgId,
            name:           isset($body['name']) ? trim((string) $body['name']) : $existing->name,
            adapter:        isset($body['adapter']) ? trim((string) $body['adapter']) : $existing->adapter,
            config:         $config,
            id:             $existing->id,
        );

        $this->credentials->update($updated);

        return $this->response->create([], 204);
    }
}
