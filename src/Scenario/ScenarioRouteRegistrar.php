<?php

declare(strict_types=1);

namespace NeNeConcierge\Scenario;

use Nene2\Routing\Router;
use Psr\Http\Message\ServerRequestInterface;

final readonly class ScenarioRouteRegistrar
{
    public function __construct(
        private ListScenariosHandler  $listHandler,
        private GetScenarioHandler    $getHandler,
        private CreateScenarioHandler $createHandler,
        private UpdateScenarioHandler $updateHandler,
        private DeleteScenarioHandler $deleteHandler,
    ) {
    }

    public function __invoke(Router $router): void
    {
        $list   = $this->listHandler;
        $get    = $this->getHandler;
        $create = $this->createHandler;
        $update = $this->updateHandler;
        $delete = $this->deleteHandler;

        $router->get('/api/v1/scenarios', static fn (ServerRequestInterface $r) => $list->handle($r));
        $router->get('/api/v1/scenarios/{id}', static fn (ServerRequestInterface $r) => $get->handle($r));
        $router->post('/api/v1/scenarios', static fn (ServerRequestInterface $r) => $create->handle($r));
        $router->patch('/api/v1/scenarios/{id}', static fn (ServerRequestInterface $r) => $update->handle($r));
        $router->delete('/api/v1/scenarios/{id}', static fn (ServerRequestInterface $r) => $delete->handle($r));
    }
}
