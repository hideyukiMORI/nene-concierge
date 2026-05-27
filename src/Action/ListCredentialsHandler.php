<?php

declare(strict_types=1);

namespace NeNeConcierge\Action;

use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

final readonly class ListCredentialsHandler implements RequestHandlerInterface
{
    public function __construct(
        private ActionCredentialRepositoryInterface $credentials,
        private JsonResponseFactory                 $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $orgId = (int) $request->getAttribute('nene2.org.id', 0);
        $items = $this->credentials->findAll($orgId);

        return $this->response->create([
            'data' => array_map(
                static fn (ActionCredential $c): array => [
                    'id'         => $c->id,
                    'name'       => $c->name,
                    'adapter'    => $c->adapter,
                    'created_at' => $c->createdAt,
                    'updated_at' => $c->updatedAt,
                    // config is intentionally omitted from list responses
                ],
                $items,
            ),
        ]);
    }
}
