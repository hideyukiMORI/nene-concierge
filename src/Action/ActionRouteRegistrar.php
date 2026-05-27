<?php

declare(strict_types=1);

namespace NeNeConcierge\Action;

use Nene2\Routing\Router;
use NeNeConcierge\Analytics\ScenarioAnalyticsHandler;
use Psr\Http\Message\ServerRequestInterface;

final readonly class ActionRouteRegistrar
{
    public function __construct(
        private ListCredentialsHandler      $listHandler,
        private CreateCredentialHandler     $createHandler,
        private UpdateCredentialHandler     $updateHandler,
        private DeleteCredentialHandler     $deleteHandler,
        private ScenarioAnalyticsHandler    $analyticsHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $list      = $this->listHandler;
        $create    = $this->createHandler;
        $update    = $this->updateHandler;
        $delete    = $this->deleteHandler;
        $analytics = $this->analyticsHandler;

        $router->get('/api/v1/action-credentials', static fn (ServerRequestInterface $r) => $list->handle($r));
        $router->post('/api/v1/action-credentials', static fn (ServerRequestInterface $r) => $create->handle($r));
        $router->patch('/api/v1/action-credentials/{id}', static fn (ServerRequestInterface $r) => $update->handle($r));
        $router->delete('/api/v1/action-credentials/{id}', static fn (ServerRequestInterface $r) => $delete->handle($r));
        $router->get('/api/v1/scenarios/{id}/analytics', static fn (ServerRequestInterface $r) => $analytics->handle($r));
    }
}
