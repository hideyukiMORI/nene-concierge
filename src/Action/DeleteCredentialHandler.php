<?php

declare(strict_types=1);

namespace NeNeConcierge\Action;

use Nene2\Http\JsonResponseFactory;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

final readonly class DeleteCredentialHandler implements RequestHandlerInterface
{
    public function __construct(
        private ActionCredentialRepositoryInterface $credentials,
        private JsonResponseFactory                 $response,
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $orgId = (int) $request->getAttribute('nene2.org.id', 0);
        $id    = (int) $request->getAttribute('id', 0);

        $this->credentials->delete($id, $orgId);

        return $this->response->create([], 204);
    }
}
