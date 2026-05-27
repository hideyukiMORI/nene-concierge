<?php

declare(strict_types=1);

namespace NeNeConcierge\Action;

use Nene2\Http\JsonResponseFactory;
use Nene2\Routing\Router;
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
        $id    = (int) Router::param($request, 'id');

        $this->credentials->delete($id, $orgId);

        return $this->response->create([], 204);
    }
}
